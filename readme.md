# WatrBX Recontinued (a.k.a. `watrbx-fixed`)

WatrBX Recontinued is a continuation of **watrbx 1**, an old Roblox revival from around 2015-2016.

The goal is to get an old 2016 Roblox client working with this server and fix the parts of the website that are still broken.

This is a project to help people build their own revivals!

This project is entirely based on **watrbx 1's** source code.

## What's new?

I've added a few things that weren't in the original revival, such as:

- Functional Admin Panel (yes, this is the only part I used AI, sorry 💀)
- Scripts to make starting and stopping the server easier
- First-time setup script
- Various fixes and patches
- Local storage for assets, thumbnails, etc...

This is not everything! You should check the code and roadmap!
The roadmap is NOT final, it is being updated!

## Roadmap

- [ ] Admin Panel
- [ ] Local Storage Patches
- [X] Database Fixes
- [ ] Promotion Links (invite people to play this and the link owner gets robux and tixs from people joining using his link)
- [ ] Most of the APIs (`<apiname>.roblox.com`)
- [X] DataPersistance V2 (DataStores) (support w/ asteroid and local storage)
- [X] Game Server APIs
- [ ] (IMPORTANT) Fix register giving: "Sorry, an error occoured"

## Running

I've only tested this project on Linux (Ubuntu). The instructions below cover several operating systems and distros, but I haven't tested all of them myself.

You will also have to download the required assets that the client uses. (Animations, Sounds, Meses, etc.) (Mostly corescripts)

### Requirements

To run the server, you'll need to install these stuff:

- PHP (only PHP 8.4+)
- Composer
- MariaDB
- OpenSSH
- OpenSSL
- Git (to clone the repository)

Some PHP extensions may also be required depending on the code and your PHP version. This has been tested on PHP 8.5.
You'll need the `fileinfo`, `pdo`, `soap` (RCC communication, optional), `dom` extensions.

### Linux (Ubuntu / Debian)

**1. Install the dependencies**

```bash
sudo apt update
sudo apt install git composer php php-cli php-mysql php-curl php-xml php-mbstring mariadb-server openssh-client openssl nginx php-fpm
```

**2. Clone the repository**

```bash
git clone http://github.com/Eduardo7881/watrbx-recontinued.git
cd watrbx-recontinued
```

**3. Run the setup script**

```bash
chmod +x init.sh start-db.sh server
./init.sh
```

Follow the instructions provided by the setup script.

**4. Start MariaDB**

If MariaDB isn't already running:

```bash
sudo systemctl start mariadb
```

**5. Start the website with the PHP Development Server (development only)**

```bash
./server
```

The PHP Development Server is convenient for local testing, but it is not recommended for production hosting.

### Nginx (Recommended for production)
No information here yet! I don't use nginx, but you can find information in the original readme.

## Fedora:

**1. Install the dependencies**

```bash
sudo dnf install git composer php php-cli php-mysqlnd php-curl php-xml php-mbstring mariadb-server openssh-clients openssl
```

**2. Clone the repository**

```bash
git clone http://github.com/Eduardo7881/watrbx-recontinued.git
cd watrbx-recontinued
```

**3. Run the setup script**

```bash
chmod +x init.sh start-db.sh server
./init.sh
```

**4. Start MariaDB**

```bash
sudo systemctl enable --now mariadb
```

**5. Start the website**

```bash
./server
```

Follow any additional instructions from the setup script.

### Arch Linux

**1. Install the dependencies**

```bash
sudo pacman -Syu --needed git composer php php-apache mariadb openssh openssl
```

If the project needs PHP extensions that aren't enabled by default, check your PHP configuration in `/etc/php/php.ini`.

**2. Clone the repository**

```bash
git clone http://github.com/Eduardo7881/watrbx-recontinued.git
cd watrbx-recontinued
```

**3. Run the setup script**

```bash
chmod +x init.sh start-db.sh server
./init.sh
```

**4. Initialize MariaDB**

On a fresh installation, initialize the database directory:

```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

Skip this step if MariaDB has already been initialized.

**5. Start MariaDB**

```bash
sudo systemctl enable --now mariadb
```

**6. Start the website**

```bash
./server
```

### macOS

**Note:** macOS support has not been tested. These instructions assume you're using Homebrew.

**1. Install Homebrew**

If you don't have Homebrew installed, follow the instructions on its official website:

http://brew.sh/

**2. Install the dependencies**

```bash
brew install git composer php mariadb openssl
```

**3. Clone the repository**

```bash
git clone http://github.com/Eduardo7881/watrbx-recontinued.git
cd watrbx-recontinued
```

**4. Run the setup script**

```bash
chmod +x init.sh start-db.sh server
./init.sh
```

**5. Start MariaDB**

```bash
brew services start mariadb
```

**6. Start the website**

```bash
./server
```

If a script fails because it uses Linux-specific commands, you'll need to adapt it for macOS.

### Windows

**Note:** Windows support has not been tested. The easiest way to try running this project is through WSL2 with Ubuntu.

#### Option 1: WSL2 (Recommended)

**1. Install WSL2**

Open PowerShell as Administrator and run:

```powershell
wsl --install -d Ubuntu
```

Restart your computer if Windows asks you to.

**2. Open Ubuntu**

Launch Ubuntu from the Start menu and complete its initial setup.

**3. Install the dependencies**

Inside the Ubuntu terminal:

```bash
sudo apt update
sudo apt install git composer php php-cli php-mysql php-curl php-xml php-mbstring mariadb-server openssh-client openssl
```

**4. Clone the repository**

```bash
git clone http://github.com/Eduardo7881/watrbx-recontinued.git
cd watrbx-recontinued
```

**5. Run the setup script**

```bash
chmod +x init.sh start-db.sh server
./init.sh
```

**6. Start MariaDB**

```bash
sudo service mariadb start
```

**7. Start the website**

```bash
./server
```

Open the local address displayed in the terminal using your Windows browser.

#### Option 2: Native Windows

Running the project directly on Windows will require additional changes.

The provided scripts use Unix-style shell commands, so `init.sh`, `start-db.sh`, and `server` may not work in a regular Command Prompt or PowerShell session.

For a native installation, you'll need to install PHP, Composer, MariaDB, OpenSSH, and OpenSSL separately, configure PHP and its required extensions, and adapt the scripts to work on Windows.

I haven't tested this setup, so WSL2 is the recommended option for now.

## Contributing

Contributions are welcome! If you want to add a feature, fix something, improve the code, or suggest an idea, feel free to open an issue or submit a pull request.

I'm still working on getting everything functional, so there's plenty left to do.

## Disclaimer

Some assets included in this project belong to Roblox Corporation. This project is not affiliated with or endorsed by Roblox Corporation.

I'm **NOT watrabi**, the original owner of WatrBX.

This is **NOT WatrBX 2's source code**. It's also not a leak. The code was publicly available.

## About the Code

I'm EXTREMELY new to PHP. I know the basics, but I'm still learning the more advanced stuff.

I'm learning as I go, so don't be surprised if you find some questionable code in here. There's probably a better way to do some things, and I'll keep fixing stuff as I learn more.

That's pretty much it. Thanks for checking out the project!
