# Oskhar · Personal Universe

Portfolio 3D menggunakan Three.js dan Vite. Konten Bahasa Indonesia dan Inggris bersumber dari `cv.md`.

## Menjalankan

Gunakan Node.js 20.19+ atau 22.12+.

```bash
npm install
npm run dev
```

Buka alamat di terminal, biasanya http://localhost:5173.

```bash
npm run build
npm run preview
```

Hasil `dist/` dapat di-host sebagai situs statis, termasuk dalam subfolder. Build menyalin subset aset yang digunakan; koleksi lengkap tetap berada di `public/lib/`.

## GitHub Pages

Situs dipublikasikan di https://oskhar.github.io/ dari repository `oskhar/oskhar.github.io`.
Workflow `.github/workflows/deploy-pages.yml` berjalan otomatis ketika branch `main` diperbarui, atau melalui **Actions → Deploy portfolio to GitHub Pages → Run workflow**.
Workflow menggunakan Node.js 22, menjalankan `npm ci` dan `npm run build`, lalu menerbitkan isi `dist/` melalui GitHub Pages. Pengaturan **Pages → Build and deployment → Source** menggunakan **GitHub Actions**.
Navigasi memakai hash (`#/origin`, `#/nova`, dan lainnya), sehingga URL destinasi dapat dibuka langsung di hosting statis. Koleksi aset sumber tidak ikut dipublikasikan seluruhnya; hanya aset pilihan dari build Vite yang diunggah.

## Eksplorasi

Halaman awal memakai scope untuk memilih planet/satelit. Mouse mengarahkan scope; tombol panah memilih destinasi dan Enter memasukinya. Menu planet juga tersedia untuk keyboard dan HP.

Intro menampilkan `welcome to my space` dan nama “oskhar” di atas scene orbit, dengan lapisan hitam semi-transparan bergaya sinematik.

Saat memilih planet, kamera mundur 1,5 unit dari kaca ke kursi pilot dan memperlihatkan kokpit 3D. Pengunjung dapat memakai autopilot atau menyalakan Master Power, Ignition, Nav Align, dan Drive Arm secara berurutan menggunakan tombol 1–4 atau kontrol layar. Throttle mengatur laju pendekatan. Planet dan bintang di luar kaca berasal dari scene orbit yang sama; kamera benar-benar bergerak menuju planet sebelum masuk ke dunianya. Tombol lewati, pembatalan navigasi, dan reduced motion didukung.

Di dalam destinasi, WASD digunakan untuk berjalan, mouse/drag untuk melihat, dan Shift untuk berlari. Klik scene untuk mouse look; Esc melepas mouse. Dekati benda bertanda cahaya lalu tekan E atau tombol interaksi. Saat membaca, scroll atau swipe menggulir seluruh penjelasan; klik di luar layar atau tombol Kembali eksplorasi memulihkan posisi. HP memakai joystick dan drag.

## Destinasi

- `#/origin`: apartemen elegan 10 × 11 meter dengan kayu hangat, furnitur senada, dapur modular menyatu, meja makan, ruang tamu, kamar, kamar mandi dan workstation tiga monitor, keyboard, mouse, laptop serta PC. Biografi dibuka melalui workstation; buku, globe, bingkai, TV dan lampu memiliki interaksi lain.
- `#/chronos`: arsip enam bab overseas banking dengan koridor monumental, artefak berbeda, pilihan konteks konsevenual bilingual, progres pemulihan fragmen, dan akses langsung ke cerita pengalaman. Seluruh aturan contoh bersifat ilustratif.
- `#/nova`: enam kendaraan dengan siluet berbeda—interceptor, explorer, shuttle kru, lander, rover dan cargo. Konsol ditempatkan di luar radius putar kendaraan. Keenam cerita proyek berasal dari CV, termasuk monitoring infrastruktur dan penelitian arsitektur.
- `#/atlas`: laboratorium backend dengan tujuh perangkat simulasi: perambatan perubahan domain, traffic request, reservoir event, query dan indeks, circuit breaker, rollout canary, serta proyeksi read model. Slider mengubah parameter model; animasi 3D, diagram hidup, dan metrik memperlihatkan dampaknya.
- `#/station`: terminal email, GitHub, LinkedIn dan CV.

## Sumber utama

- `src/space/main.js`: UI, routing, bahasa dan navigasi.
- `src/space/universe.js`: orbit, kamera, jalur penerbangan dan perpindahan scene.
- `src/space/flight.js`, `flight.css`: intro sinematik hitam semi-transparan, penerbangan pergi/pulang dan kontrol pilot.
- `src/space/cockpit.js`: kokpit 3D, instrumen, sakelar, throttle dan tangan pilot.
- `src/space/home.js`, `furnishings.js`: rumah, dapur, ruang makan, workstation dan penempatan benda pada permukaan penyangganya.
- `src/space/worlds.js`, `design.js`: galeri, altar, kristal, aura dan pesawat prosedural.
- `src/space/interactions.js`, `reader-surface.js`: fokus objek, layar pembacaan dan collision.
- `src/space/content.js`, `exhibits.js`, `biography.js`, `banking-notes.js`: konten bilingual. Narasi pengalaman mengikuti CV; detail yang tidak disebutkan di CV dijelaskan sebagai pertimbangan teknis, tanpa mengklaim implementasi internal bank.
- `public/cv.md`: versi publik CV, tanpa catatan persiapan interview. Perbarui bersama konten bilingual jika CV berubah.

Model KayKit Space Base Bits berasal dari paket lokal, berlisensi CC0 (Kay Lousberg); lisensinya disertakan. Furnitur lain berasal dari koleksi lokal. Kokpit, pesawat prosedural, altar, kristal dan planet dibuat dengan kode. Font DM Sans dan Manrope memakai Google Fonts dengan fallback sans-serif.

Kualitas rendah mematikan shadow caster lampu sekaligus renderer shadow flag untuk menjaga kompatibilitas shader Three.js. Konten tetap tersedia sebagai halaman teks jika WebGL tidak dapat dijalankan. Implementasi lama di `src/my_js/` dan `src/my_css/` dipertahankan sebagai referensi.

Penanda interaksi memakai beacon bercahaya dengan ikon E berukuran tetap di layar. Label kontras muncul ketika pengunjung mendekat atau mengarahkan kamera. Penanda tidak lagi bergantung pada lingkaran lantai di bawah furnitur. Orientasi pembaca mengikuti quaternion permukaan, termasuk tablet horizontal, sehingga tulisan tidak terbalik saat kamera menunduk. Setiap permukaan cerita di Origin ditempatkan di depan objeknya dan diperiksa agar tidak terhalang furnitur.

Setiap destinasi memiliki satu visitor landing berth dengan pesawat, lampu perimeter, dan jalur akses. Shuttle berukuran manusia menghadap ke konten destinasi. Tombol kembali menjalankan animasi berjalan selama 4,6 detik melalui sisi pesawat, pintu samping yang terbuka, ramp, kabin, dan kursi pilot; mesin baru dapat menyala setelah boarding selesai. Pesawat melaju maju dengan lintasan membelok dan menanjak, sehingga konten terlihat menjauh dari samping, terbang ke orbit awal, lalu kamera maju 1,5 meter ke kaca kokpit. Reduced motion dan tombol skip tetap tersedia. Implementasi area parkir: `src/space/landing.js`.

Panel hull statis digabung per material untuk mengurangi draw call. Saat boarding, shadow map dipakai ulang; layar kokpit dan kontrol diperbarui 10 kali/detik sementara kamera tetap mengikuti frame render. Hull dan kokpit yang sama dipertahankan sepanjang animasi agar tidak muncul/hilang saat duduk.

Navigasi kembali ke orbit berjalan otomatis berdasarkan waktu berlalu, termasuk saat frame rate rendah. Error pada frame transisi diteruskan ke pemulihan navigasi agar overlay dan kontrol tidak terkunci. Pendekatan ke planet memakai tahapan mesin dan waktu jelajah yang lebih singkat. Saat membaca, klik/tap di luar layar konten atau gunakan tombol Kembali eksplorasi berukuran besar; klik di dalam konten dan scroll/swipe tidak menutup bacaan.

Setiap objek interaktif menampilkan judul mengambang dan ringkasan topik sebelum diklik. Label menyesuaikan posisi untuk mengurangi tumpang tindih, mengikuti bahasa aktif, dan disembunyikan selama membaca serta penerbangan.

Tombol kembali dan interaksi pesawat memakai handler yang sama. Permintaan pulang secara eksplisit menjalankan boarding dan penerbangan meskipun animasi lingkungan dinonaktifkan; tombol Skip tetap tersedia. Interaksi pesawat hanya muncul dalam radius 1,15 meter dari akses ramp. Boarding dari dekat pintu memakai jalur langsung 2,6 detik, sedangkan dari area konten memakai jalur berjalan 4,6 detik.

Regresi transisi: timestamp RAF pertama dapat mendahului waktu pembuatan sesi. Elapsed time dan delta frame dibatasi ke nilai non-negatif, dan parameter kurva berjalan dibatasi ke rentang 0–1, agar CatmullRomCurve3 tidak gagal pada frame pertama (terutama input sentuh).

Perjalanan pulang melewati tiga planet lain di adegan orbit melalui lintasan kurva dengan pemeriksaan jarak aman, sebelum mendekati kaca pada posisi halaman awal. Terdapat gerakan menoleh ringan saat flyby agar planet terlihat pada layar portrait. Langit lokal tiap destinasi menyembunyikan benda orbit yang sedang dikunjungi; perubahan ini tidak menyembunyikannya di adegan orbit utama.

Halaman utama memiliki rotasi planet dengan laju berbeda, precession cincin alami, rotasi stasiun, serta sorotan permukaan dan atmosfer saat kursor mengenai planet. Tidak ada lingkaran orbit dekoratif tambahan. Efek tambahan berada di grup terpisah dari target navigasi dan tidak disalin ke langit destinasi. Flyby pulang dipangkas dari sekitar 5,04 detik menjadi 1,8 detik; fase lepas landas serta gerakan kepala ke kaca mempertahankan durasinya.

Kaca depan shuttle bersifat panoramik tanpa tiang tengah. Kamera menghadap pintu dua panel dan berhenti selama pembukaannya sebelum masuk, lalu berpindah mulus ke kursi pilot. Navbar hanya menyisakan logo, nama oskhar, dan kontrol bahasa; petunjuk mengarahkan scope di halaman utama tetap ditampilkan.

Tombol kembali ke orbit memakai aksen emas kontras dan glow lembut, dengan animasi glow dimatikan pada reduced motion. Keenam altar Nova selalu memiliki kendaraan: lander dan rover native tampil sampai model eksternal terverifikasi selesai dimuat. Bila model gagal dimuat, kendaraan native dipertahankan; model yang berhasil dipasang diselaraskan kembali ke permukaan altar.

Semua bagian penjelasan dibaca dalam satu dokumen vertikal pada layar objek 3D. Scroll wheel, drag/swipe, serta tombol atas/bawah atau Page Up/Down menggulir bacaan; indikator dan scrollbar menunjukkan kelanjutannya. Klik di dalam layar tidak menutup bacaan. Kursor di luar layar menampilkan petunjuk melanjutkan eksplorasi, dan klik di luar atau tombol Kembali eksplorasi menutup bacaan. Tombol pergantian bagian kiri/kanan dihapus.

## Kontrol mobile

Pada perangkat sentuh, HUD diringkas menjadi menu navigasi/pengaturan, joystick kiri, dan tombol aksi kontekstual kanan. Geser scene untuk melihat; sensitivitas kamera dapat diatur lewat Menu. Panel aktivitas Chronos dibuka melalui tombol ◈. Cerita memakai panel teks yang dapat digulir langsung. Menu juga menyediakan fullscreen jika browser mendukungnya; portrait, landscape, dan safe area layar ditangani tanpa mengubah isi destinasi.

Chronos menyediakan diagram langkah dan perbandingan dua konteks. Atlas menyediakan parameter, injeksi beban/gangguan, pause, langkah satu detik simulasi, reset per wahana, serta catatan engineer. Keduanya menyertakan ringkasan ilustrasi pada versi teks. Panel aktivitas mobile tetap dibuka melalui ◈; menu mobile tetap hanya berisi kembali ke orbit, sensitivitas kamera, dan fullscreen.


### Atlas Backend Observatory

Pilih perangkat 01–07, geser parameter, lalu gunakan aksi eksperimen. Wahana API/event/reliability berjalan terus saat berada di laboratorium; query, canary, perubahan aturan, dan penulisan event dipicu lewat kontrol. Jeda membekukan semua model. Tombol `Maju 1 detik (wahana ini)` memajukan perangkat terpilih saat mengamati perubahan secara bertahap. Reduced motion membekukan gerakan visual; metrik model tetap berjalan.

- Domain: coupling menentukan luas dampak perubahan; isolasi membatasi dampak ke satu domain.
- Load balancer: pengunjung masuk, jumlah server, dan algoritma menentukan antrean lokal. Setiap server menampung hingga 40 request; antrean >8 selama 3 detik memicu restart perlindungan 5 detik pada model edukasi ini. Ini bukan klaim bahwa overload nyata selalu menyebabkan crash.
- Event: producer menambah antrean, kapasitas consumer menguranginya. Consumer dapat dijeda; overflow dihitung pada batas 200.
- Query: scan membutuhkan N pemeriksaan; indeks memakai pendekatan sederhana `ceil(log2(N)) + 1`. Ini model pengajaran, bukan query planner database sebenarnya.
- Reliability: tiga kegagalan beruntun membuka circuit selama tiga detik simulasi; half-open menguji pemulihan.
- Canary: traffic dan peluang cacat menentukan error sampel acak deterministik. Rollback menghentikan traffic versi baru.
- Read model: event ditulis ke source, lalu diterapkan sesudah jeda; proyeksi bisa dijeda atau dibangun ulang melalui replay.

Seluruh angka merupakan hasil model edukasi lokal, bukan benchmark atau metrik pekerjaan nyata. Pengujian model: `npm run test:atlas`.


Atlas memakai status warna bersama: putih = idle, hijau = sehat, kuning = beban tinggi/tertunda, merah = down/gagal. Kontrol parameter dibuka lewat aksi Bereksperimen atau tombol Parameter, dan tidak menutupi laboratorium secara default. Preview 2D hanya muncul saat kursor menunjuk perangkat; pada mobile kontrol dibuka melalui aksi perangkat atau ◈. Label mengambang Atlas dihapus; identitas perangkat tetap tercetak pada meja.

Wahana load balancer menampilkan delapan server. Kontrol dasarnya adalah pengunjung masuk, jumlah server, dan pilihan algoritma: Round robin, Beban paling ringan, atau Satu server saja (contoh buruk). Kecepatan server dan profil server lambat ada di Pengaturan lanjutan. Status down muncul dari overload berkepanjangan, bukan slider manual. Request menunggu berwarna kuning, server down merah tidak menerima pekerjaan, dan kapasitas yang tidak dipakai berwarna putih.


Atlas memakai interior fasilitas riset tertutup: hull bertekanan, airlock dengan jalur keluar yang lapang, plafon layanan dan ventilasi, jendela observasi menuju ruang persiapan sampel, lemari reagen, meja mikroskop, konsol analisis, dan layar instrumen di dinding. Data Helix A-07 berputar di dalam vessel containment pusat. Wahana backend dipasang dalam housing instrumen dengan panel observasi, cap tekanan, probe pemindai, dan penanda keselamatan. Geometri lingkungan statis digabung berdasarkan material untuk membatasi draw call; gerak spesimen serta layar instrumen mengikuti pengaturan motion/pause.

Kontrol seluruh wahana menampilkan tujuan eksperimen, bantuan singkat per input, status tombol yang eksplisit (aktif/mati atau jeda/lanjutkan), dan penjelasan sebab-akibat berikut saran perbaikan. Pengaturan teknis lanjutan disembunyikan secara default. Kondisi layanan luar dan kualitas kandidat rilis dipilih sebagai skenario yang mudah dibaca.
