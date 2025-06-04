FROM continuumio/miniconda3:24.7.1-0

RUN apt-get update && apt-get install -y logrotate docker.io && apt-get clean

ADD requirements.txt /
RUN pip install -r requirements.txt

# Logrotate
COPY docker/logrotate_app_logs /etc/logrotate.d/log-file
RUN chmod 644 /etc/logrotate.d/log-file

# Create new user to not run in sudo mode
RUN useradd --create-home appuser
WORKDIR /home/appuser

COPY . /home/appuser
COPY entrypoint.sh /home/appuser/entrypoint.sh