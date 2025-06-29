***29/06/2025 10:00 PM Project Released.*** Our thanks to [Forever](https://github.com/foreverxrdd) for his interest and ideas..

***28/06/2025 02:51 PM Project Released.***

### **English**

# GutsV | API-Powered Registration Bot

This is a standalone, advanced Discord registration bot for `discord.js v14`. It leverages the powerful **GutsV API** to offer a hybrid registration system, combining automated data retrieval with manual staff control for a smarter and more efficient process.

### Core Concept

The bot enhances the traditional registration workflow. When a staff member initiates a registration, the bot first queries the GutsV API to find existing data on the user. If data is found, it uses that for a quick and consistent registration. If not, it seamlessly proceeds with the information manually provided by the staff, giving you the best of both worlds.

### Key Features

  * **Hybrid Registration Command:** The `.register` command first checks the API for user data before falling back to manual inputs.
  * **Data-Driven Registration:** Uses API data (name, age, gender) for fast and accurate registrations.
  * **Intelligent Logging:** Logs extra details pulled from the API, such as the user's bio and pronouns, providing deeper insights.
  * **Reduces Staff Errors:** Minimizes typos and inconsistencies by using verified data from the API when available.
  * **Fully Configurable:** Easily set up all roles, permissions, and settings in a single configuration file.

-----

### Installation

1.  **Download the Project:**

      * Go to the [GitHub repository page](https://github.com/gutsv-project/UserAPI-Register-Bot).
      * Click the green **`<> Code`** button and select **`Download ZIP`**.
      * Unzip the downloaded file into a folder.

2.  **Install Dependencies:**

      * Open a terminal inside the unzipped project folder.
      * Run the command:

        ```sh
        npm install
        ```

3.  **Configuration:**

      * Edit the `config.js` file with your server's and bot's information.


    <!-- end list -->

    ```javascript

    //  exp config.js
      // --- Basic Settings ---
      token: 'BOT_TOKEN',
      serverid: 'SERVER_ID',
      prefix: '.',

      // --- Roles ---
      roles: {
        regauth: 'ROLE_ID',
        unreg: 'ROLE_ID',
        man: 'ROLE_ID',
        woman: 'ROLE_ID'
      },

      // --- Tag Settings ---
      tag: '•',

      // --- GutsV API ---
      api: {
        baseURL: 'https://api.gutsv.xyz/api'
      },

      // --- Log ---
      log: {
        channel: 'CHANNEL_ID',
        showbio: true,
        showpronouns: true
      }
    ```

-----

### Usage

The bot's primary command is for staff members with the registrar role.

  * `.register <@user/ID> [name] [age]`
      * **How it works:** When a staff member uses this command, the bot first queries the GutsV API.
      * **If Data is Found:** The bot will present the fetched data (e.g., "API found user as 'Veli | 20 | Male'.") and ask for confirmation to proceed.
      * **If No Data is Found:** The bot proceeds with manual registration using the `[name]` and `[age]` provided in the command.

### The GutsV API Advantage

What makes this bot unique is its exclusive integration with the GutsV API. It can analyze a user's cross-server public footprint (nickname history, bio, pronouns), ensuring more consistent and accurate user profiles on your server and enabling smarter community management.

-----

### Support & Contribution

For suggestions, bug reports, or contributions, please open an issue on our GitHub repository.

Developed by the **Project GutsV Team**


### **Türkçe**

# GutsV | API Destekli Kayıt Botu

Bu, `discord.js v14` için geliştirilmiş, tek başına çalışan, gelişmiş bir Discord kayıt botudur. Daha akıllı ve verimli bir süreç sunmak için, otomatik veri çekme ile yetkili kontrolünü birleştiren hibrit bir kayıt sistemi sunmak üzere güçlü **GutsV API**'sinden yararlanır.

### Ana Konsept

Bot, geleneksel kayıt iş akışını zenginleştirir. Bir yetkili kaydı başlattığında, bot önce kullanıcı hakkında mevcut verileri bulmak için GutsV API'sini sorgular. Veri bulunursa, hızlı ve tutarlı bir kayıt için bu verileri kullanır. Bulunmazsa, yetkili tarafından manuel olarak sağlanan bilgilerle sorunsuz bir şekilde devam eder ve size her iki dünyanın da en iyisini sunar.

### Özellikler

  * **Hibrit Kayıt Komutu:** `.kayıt` komutu, manuel girdilere başvurmadan önce API'yi kullanıcı verileri için kontrol eder.
  * **Veri Odaklı Kayıt:** Hızlı ve doğru kayıtlar için API verilerini (isim, yaş, cinsiyet) kullanır.
  * **Akıllı Loglama:** Kullanıcının biyografisi ve zamirleri gibi API'den çekilen ekstra ayrıntıları loglayarak daha derin içgörüler sağlar.
  * **Yetkili Hatalarını Azaltır:** Mümkün olduğunda API'den doğrulanmış verileri kullanarak yazım hatalarını ve tutarsızlıkları en aza indirir.
  * **Tamamen Yapılandırılabilir:** Tüm rolleri, izinleri ve ayarları tek bir yapılandırma dosyasında kolayca ayarlayın.

-----

### Kurulum

1.  **Projeyi İndirin:**

      * [GitHub reposu sayfasına](https://github.com/gutsv-project/UserAPI-Register-Bot) gidin.
      * Yeşil renkli **`<> Code`** butonuna tıklayın ve **`Download ZIP`** seçeneğini seçin.
      * İndirilen `.zip` dosyasını bir klasöre çıkartın.

2.  **Bağımlılıkları Yükleyin:**

      * Proje dosyalarını çıkardığınız klasörün içinde bir terminal açın.
      * Şu komutu çalıştırın:

        ```sh
        npm install
        ```

3.  **Yapılandırma:**

      * `config.js` dosyasını sunucu ve bot bilgilerinize göre düzenleyin.


    <!-- end list -->

    ```javascript

    //  exp config.js
      // --- Basic Settings ---
      token: 'BOT_TOKEN',
      serverid: 'SERVER_ID',
      prefix: '.',

      // --- Roles ---
      roles: {
        regauth: 'ROLE_ID',
        unreg: 'ROLE_ID',
        man: 'ROLE_ID',
        woman: 'ROLE_ID'
      },

      // --- Tag Settings ---
      tag: '•',

      // --- GutsV API ---
      api: {
        baseURL: 'https://api.gutsv.xyz/api'
      },

      // --- Log ---
      log: {
        channel: 'CHANNEL_ID',
        showbio: true,
        showpronouns: true
      }
    ```

-----

### Kullanım

Botun birincil komutu, kayıt yetkilisi rolüne sahip yetkililer içindir.

  * `.kayıt <@kullanıcı/ID> [isim] [yaş]`
      * **İşleyiş:** Bir yetkili bu komutu kullandığında, bot önce GutsV API'si üzerinden kullanıcıyı sorgular.
      * **Veri Bulunursa:** Bot, çekilen verileri sunar (Örn: "API, kullanıcıyı 'Veli | 20 | Erkek' olarak buldu.") ve devam etmek için yetkiliden onay ister.
      * **Veri Yoksa:** Bot, komutta belirtilen `[isim]` ve `[yaş]` ile manuel kayda devam eder.

### GutsV API Avantajı

Bu botu benzersiz kılan şey, GutsV API'si ile olan özel entegrasyonudur. Kullanıcının sunucular arası herkese açık dijital ayak izini (takma ad geçmişi, biyografi, zamirler) analiz edebilir, bu da sunucunuzda daha tutarlı ve doğru kullanıcı profilleri sağlar ve daha akıllı topluluk yönetimini mümkün kılar.

-----

### Destek ve Katkı

Öneri, hata bildirimi veya katkıda bulunmak için lütfen GitHub repomuzda bir "issue" açın veya discord sunucumuza gelerek bize bildirin.

Geliştiren: **GutsV**
