import os
import json
import requests
from typing import Optional

from app.domain.users.entities import OAuthUserInfo
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import jwt, JWTError

from app import api_logger

logger = api_logger.get()


class OAuthService:
    """Domain service for OAuth token verification and user info extraction"""

    def __init__(self):
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.apple_client_id = os.getenv("APPLE_CLIENT_ID")
        self.apple_keys_url = "https://appleid.apple.com/auth/keys"

    async def verify_google_token(
        self, id_token_str: str, expected_google_id: str, expected_email: Optional[str] = None
    ) -> OAuthUserInfo:
        """Verify Google ID token and return unified user info"""
        try:
            # Verify the token with Google
            id_info = id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), self.google_client_id
            )
            logger.info(f"Google ID token verified: {id_info}")

            # Check if the Google ID matches
            if id_info.get("sub") != expected_google_id:
                logger.error(
                    f"Google token verification failed: ID mismatch: {id_info.get('sub')} != {expected_google_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token verification failed: ID mismatch",
                )

            # Check if email matches (if provided)
            if expected_email and id_info.get("email") != expected_email:
                logger.error(
                    f"Google token verification failed: Email mismatch: {id_info.get('email')} != {expected_email}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token verification failed: Email mismatch",
                )

            return OAuthUserInfo(
                provider="google",
                provider_id=id_info.get("sub"),
                email=id_info.get("email"),
                name=id_info.get("name"),
                profile_picture=id_info.get("picture"),
                is_email_verified=id_info.get("email_verified", False),
            )

        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google token verification failed: {str(e)}",
            )

    def _get_apple_public_key(self, kid: str) -> dict:
        """Get Apple's public key for the given key ID"""
        try:
            response = requests.get(self.apple_keys_url)
            response.raise_for_status()
            keys = response.json()

            # Find the key with matching kid
            for key in keys["keys"]:
                if key["kid"] == kid:
                    return key

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Apple public key not found for the given token",
            )

        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch Apple public keys",
            )

    async def verify_apple_token(
        self, identity_token: str, expected_apple_id: str
    ) -> OAuthUserInfo:
        """Verify Apple identity token and return unified user info"""
        try:
            # Get the token header to find the key ID
            unverified_header = jwt.get_unverified_header(identity_token)
            kid = unverified_header.get("kid")

            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Apple token missing key ID in header",
                )

            # Get the appropriate public key
            public_key_info = self._get_apple_public_key(kid)

            # Verify and decode the token
            token_claims = jwt.decode(
                identity_token,
                public_key_info,
                algorithms=[public_key_info["alg"]],
                audience=self.apple_client_id,
                options={"verify_exp": True},
            )

            # Check if the Apple ID matches
            if token_claims.get("sub") != expected_apple_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Apple token verification failed: ID mismatch",
                )

            return OAuthUserInfo(
                provider="apple",
                provider_id=token_claims.get("sub"),
                email=token_claims.get("email"),
                name=None,  # Apple doesn't provide name in the token
                profile_picture=None,  # Apple doesn't provide profile picture
                is_email_verified=token_claims.get("email") is not None,
            )

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Apple token verification failed: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Apple token verification failed: {str(e)}",
            )
