#!/bin/bash

# Update system
yum update -y

# Install required packages
yum install -y \
    git \
    nodejs \
    npm \
    aws-cli \
    httpd

# Create user for website
useradd -m -s /bin/bash website

# Set up website directory
mkdir -p /var/www/odisha-news
chown -R website:website /var/www/odisha-news

# Clone repository
su - website -c "git clone https://github.com/eastkode/POV.git /var/www/odisha-news"

# Install dependencies
su - website -c "cd /var/www/odisha-news && npm install"

# Configure Apache
sed -i 's/#ServerName www.example.com:80/ServerName localhost/' /etc/httpd/conf/httpd.conf

# Create virtual host configuration
sudo tee /etc/httpd/conf.d/odisha-news.conf > /dev/null << EOF
<VirtualHost *:80>
    ServerAdmin admin@odisha-news.com
    DocumentRoot "/var/www/odisha-news"
    DirectoryIndex index.html
    ErrorLog "/var/log/httpd/odisha-news-error.log"
    CustomLog "/var/log/httpd/odisha-news-access.log" combined

    <Directory "/var/www/odisha-news">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
EOF

# Set up SSL certificate
sudo tee /etc/httpd/conf.d/odisha-news-ssl.conf > /dev/null << EOF
<VirtualHost *:443>
    ServerAdmin admin@odisha-news.com
    DocumentRoot "/var/www/odisha-news"
    DirectoryIndex index.html
    ErrorLog "/var/log/httpd/odisha-news-ssl-error.log"
    CustomLog "/var/log/httpd/odisha-news-ssl-access.log" combined

    <Directory "/var/www/odisha-news">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/odisha-news.crt
    SSLCertificateKeyFile /etc/ssl/private/odisha-news.key
</VirtualHost>
EOF

# Start services
systemctl start httpd
systemctl enable httpd

# Set up automatic deployment
sudo tee /etc/cron.daily/deploy-odisha-news > /dev/null << EOF
#!/bin/bash
su - website -c "cd /var/www/odisha-news && git pull && npm install && npm run build"
EOF
chmod +x /etc/cron.daily/deploy-odisha-news

# Set up monitoring
sudo tee /etc/cron.hourly/monitor-odisha-news > /dev/null << EOF
#!/bin/bash
systemctl status httpd | grep -q "active (running)" || {
    echo "HTTPD service stopped, restarting..." | mail -s "Odisha News Website Alert" admin@odisha-news.com
    systemctl restart httpd
}
EOF
chmod +x /etc/cron.hourly/monitor-odisha-news

# Set up log rotation
sudo tee /etc/logrotate.d/odisha-news > /dev/null << EOF
/var/log/httpd/odisha-news*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF

# Set up backup
sudo tee /etc/cron.daily/backup-odisha-news > /dev/null << EOF
#!/bin/bash
tar -czf /var/backups/odisha-news-$(date +%Y%m%d).tar.gz \
    /var/www/odisha-news \
    /etc/httpd/conf.d/odisha-news.conf \
    /etc/httpd/conf.d/odisha-news-ssl.conf
find /var/backups -name "odisha-news-*.tar.gz" -mtime +7 -exec rm {} \;
EOF
chmod +x /etc/cron.daily/backup-odisha-news

# Set up monitoring
sudo tee /etc/cron.hourly/monitor-odisha-news > /dev/null << EOF
#!/bin/bash
systemctl status httpd | grep -q "active (running)" || {
    echo "HTTPD service stopped, restarting..." | mail -s "Odisha News Website Alert" admin@odisha-news.com
    systemctl restart httpd
}
EOF
chmod +x /etc/cron.hourly/monitor-odisha-news

# Set up automatic updates
sudo tee /etc/cron.weekly/update-odisha-news > /dev/null << EOF
#!/bin/bash
yum update -y
reboot
EOF
chmod +x /etc/cron.weekly/update-odisha-news

# Set up security
sudo tee /etc/cron.daily/security-check > /dev/null << EOF
#!/bin/bash
# Check for unauthorized logins
lastlog | grep "Never logged in" | mail -s "Unauthorized logins" admin@odisha-news.com

# Check for failed login attempts
faillog | grep "Account locked" | mail -s "Locked accounts" admin@odisha-news.com
EOF
chmod +x /etc/cron.daily/security-check

# Set up backup
sudo tee /etc/cron.daily/backup-odisha-news > /dev/null << EOF
#!/bin/bash
tar -czf /var/backups/odisha-news-$(date +%Y%m%d).tar.gz \
    /var/www/odisha-news \
    /etc/httpd/conf.d/odisha-news.conf \
    /etc/httpd/conf.d/odisha-news-ssl.conf
find /var/backups -name "odisha-news-*.tar.gz" -mtime +7 -exec rm {} \;
EOF
chmod +x /etc/cron.daily/backup-odisha-news

# Set up monitoring
sudo tee /etc/cron.hourly/monitor-odisha-news > /dev/null << EOF
#!/bin/bash
systemctl status httpd | grep -q "active (running)" || {
    echo "HTTPD service stopped, restarting..." | mail -s "Odisha News Website Alert" admin@odisha-news.com
    systemctl restart httpd
}
EOF
chmod +x /etc/cron.hourly/monitor-odisha-news

# Set up automatic updates
sudo tee /etc/cron.weekly/update-odisha-news > /dev/null << EOF
#!/bin/bash
yum update -y
reboot
EOF
chmod +x /etc/cron.weekly/update-odisha-news
