FROM amd64/debian
WORKDIR /opt/Torn

# Use bash.
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Add package cache.
RUN apt update

# Install curl.
RUN apt install -y curl

# Install Node.js v14.
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt update
RUN apt install -y nodejs

# Update NPM to v7.
RUN npm i -g npm

# Install python3.
RUN apt install -y python3
RUN apt install -y python3-pip

# Install python libs.
RUN pip3 install aiohttp aiosmtplib aiohttp_cors asyncio discord_webhook motor pymongo bcrypt

# Copy source directory.
COPY . /opt/Torn

# Start the development server.
RUN cd /opt/Torn

EXPOSE 7300 7301
CMD sh /opt/Torn/start_dev_server.sh
