# Rencana Implementasi Detail: Chronos, Atlas, dan Station

Status: **dokumen perencanaan, belum implementasi**. Disusun dari [rencana konseptual](RENCANA_PENGEMBANGAN_PLANET.md) dan kondisi kode proyek pada 7 November 2026.

## 1. Hasil yang dituju

Pengunjung dapat membedakan tiga destinasi sejak muncul di titik masuk: Chronos adalah arsip dengan jalur enam bab; Atlas adalah laboratorium dengan tujuh demonstrasi berbeda; Station adalah pusat komunikasi dengan email sebagai aksi utama. Seluruh cerita, tautan, navigasi pulang, pilihan bahasa, dan versi teks tetap berfungsi.

### Batas lingkup

- Ubah hanya Chronos (`index === 1`), Atlas (`index === 3`), dan Station (`index === 4`). Nova dan Origin menjadi pembanding regresi, bukan sasaran desain ulang.
- Pertahankan identitas dan urutan enam cerita Chronos, tujuh cerita Atlas, serta empat kontak Station. Jangan mengubah hash route atau URL publik.
- Gunakan geometri prosedural dan aset yang sudah tersedia lebih dahulu. Aset baru hanya ditambahkan bila memberi fungsi yang jelas dan lolos pemeriksaan lisensi, ukuran, serta `vite.config.js`.
- Setiap animasi menjelaskan status. Tanpa animasi pun label, pilihan, dan hasil harus bisa dipahami.

## 2. Kondisi teknis dan batas yang harus diperhatikan

| Bagian | Kondisi saat ini | Dampak pada implementasi |
| --- | --- | --- |
| `src/space/worlds.js` | Satu konstruktor membuat lantai kisi 23 × 23, ring pusat, cahaya, lalu memilih `archive`, `laboratory`, atau `station`. | Pisahkan komposisi tiap destinasi. Kisi seragam dan ring pusat tidak boleh menjadi bentuk dominan pada tiga ruang baru. |
| Chronos | Enam altar berada pada radius sekitar 6,2 unit; semua memakai `addStory(n, ...)`. | Ganti koordinat dan bentuk fisik tanpa mengubah indeks cerita `0–5`. |
| Atlas | Tujuh altar dan `magneticCrystal` berada pada radius sekitar 6,2 unit. | Bangun tujuh perangkat yang berbeda; satu kristal boleh menjadi aksen inti. |
| Station | Empat `desk.glb` pada kisi 2 × 2; interaksi berjenis `link`. | Reposisi empat tautan dengan prioritas email dan identitas bentuk yang jelas. |
| Titik masuk | Untuk tiga ruang ini kamera mulai di `[0, 1.85, 9.3]`, menghadap kira-kira ke arah `-Z`. | Landmark utama harus terlihat dari arah ini. Jangan menutup jalan dari pesawat menuju ruang. |
| Pesawat pulang | `addLandingBerth()` menempatkan pesawat di `z = 17.5`, membuat jembatan hingga sekitar `z = 11`, menambah collider, dan menyesuaikan batas gerak. | Sisakan koridor masuk/pulang di sisi `+Z`; jangan letakkan bangunan baru di jalur jembatan, ramp, atau area boarding. |
| Tabrakan | `InteractiveLocation.collisions()` memakai kotak 2D dari `Box3` dengan jarak tambahan 0,35 unit. | Collider dekorasi harus selektif; cek celah efektif sesudah margin ini. Jangan mengandalkan geometri visual saja. |
| Interaksi | `interactable()` membuat target tak terlihat, beacon, label, dan layar baca; `main.js` menangani `kind: link`, baca, dan boarding. | Perangkat demo perlu state aksi sendiri; jangan membuat `kind` baru tanpa handler, teks UI, dan reset state. |
| Navigasi cepat | Tombol objek sebelumnya/berikutnya memakai `world.cards = world.interactables`; pesawat kemudian ditambahkan ke `interactables`. | Hindari menambahkan target dekoratif sebagai `interactable`; audit penghitung dan urutan waypoint agar hanya objek yang memang dimaksud. |
| Bahasa dan fallback | Isi utama di `banking-notes.js`/`exhibits.js`; `renderText()` di `main.js` membuat versi teks. | Seluruh hasil demo dan konteks ilustrasi perlu tersedia dalam ID/EN dan tetap terbaca tanpa WebGL. |
| Pengaturan | `universe.motion` mematikan pembaruan animasi dengan `dt = 0`; `universe.low` menurunkan kualitas renderer. | State tidak boleh bergantung pada waktu animasi; mode reduced motion dan kualitas rendah wajib menampilkan hasil statis yang lengkap. |

### Catatan geometri

Koordinat di bawah adalah **usulan awal untuk prototipe**, bukan ukuran final. Pusat lantai adalah `(0, 0, 0)`, depan pengunjung berada pada `+Z`, dan area isi utama saat ini sekitar `x = -10,5…10,5`, `z = -9…9,5`. Sesudah komposisi dipasang, ukur ulang `Box3`, lintasan kamera, dan ruang baca di browser. Untuk koridor berjalan, targetkan lebar bersih sedikitnya 1,8 unit setelah margin collider; untuk ruang baca, sisakan area berdiri sekitar 2,5 unit di depan layar.

## 3. Fondasi implementasi bersama

### 3.1 Struktur kode

1. Refaktor `worlds.js` agar lantai, ring, dan lampu per destinasi dibuat oleh fungsi komposisi masing-masing. Pertahankan `DestinationWorld` sebagai pemilik `cards`, `colliders`, `animations`, `entry`, `bounds`, dan `addStory()`.
2. Pecah fungsi komposisi besar ke modul baru bila `worlds.js` terus membesar, misalnya `archive-world.js`, `laboratory-world.js`, dan `station-world.js`. API setiap builder sebaiknya menerima `world`, data cerita, dan palet; jangan memindahkan logika flight atau routing ke sana.
3. Tambahkan primitive di `design.js` hanya bila dipakai lebih dari sekali: panel berbingkai, jalur lantai, konsol, rak, konektor data. Primitive menerima parent/material/ukuran dan tidak membuat cerita atau mengubah routing.
4. Definisikan data tata letak dan state demo dengan ID stabil. Jangan menggantungkan identitas pada warna, posisi, atau indeks array yang bisa berubah saat desain disetel. Indeks cerita tetap dipetakan eksplisit ke ID.
5. Pisahkan objek yang bisa dibaca dari objek yang menjalankan demo. Pilihan awal: panel kontrol HTML pada HUD dengan tombol yang dapat menerima fokus, sedangkan `addStory()` tetap membuka narasi lengkap. Bila tombol demo diletakkan di scene, sediakan padanan DOM yang identik.

### 3.2 Kontrak interaksi yang sama

- **Masuk:** landmark dan satu kalimat orientasi terlihat dari titik masuk. Jalur dari jembatan pesawat menuju elemen pertama dapat dikenali tanpa label mengambang.
- **Mendekat:** objek aktif menunjukkan judul dan ringkasan yang sudah memakai mekanisme beacon. Jarak aktivasi demo dibatasi wajar, sekitar 2–3 unit; verifikasi lewat sudut pandang mobile.
- **Memilih:** satu klik/tap/Enter/Space pada kontrol yang terfokus menjalankan satu perubahan state yang segera terlihat. Tombol `E` untuk membuka cerita tetap konsisten.
- **Membaca:** layar cerita tidak terpotong, dapat digulir, dan dapat ditutup. Saat bahasa diganti, demo dan cerita terbuka ikut diperbarui tanpa kehilangan pilihan utama.
- **Berpindah:** state demo terakhir boleh tetap hidup selama berada di destinasi, tetapi reset ke keadaan awal ketika destinasi dibangun ulang. Saat pulang ke orbit, jangan sisakan HUD demo.
- **Tanpa animasi:** garis atau partikel boleh berhenti; label hasil, jalur yang dipilih, dan status akhir tetap berubah langsung.

### 3.3 Aturan konten dan keamanan klaim

- Cerita pengalaman mengacu pada `cv.md` dan `public/cv.md`. Enam bab Chronos boleh memvisualisasikan *kategori persoalan*, bukan detail arsitektur atau alur internal OCBC.
- Gunakan label persisten **“Ilustrasi konseptual / Conceptual illustration”** pada setiap contoh transaksi, nomor rekening, status sistem, atau keputusan routing. Semua data contoh harus fiktif dan tidak menyerupai data pelanggan nyata.
- Hindari nama negara, format identitas, payment rail, angka hasil, SLA, dan diagram sistem yang terdengar spesifik bila tidak didukung CV. Bila perlu menunjukkan variasi, pakai “Tujuan A/B”, “Entitas 1/2”, dan aturan contoh yang dijelaskan sebagai ilustrasi.
- Narasi ringkas demo hanya menyimpulkan isi cerita yang sudah ada. Perubahan fakta pada CV harus disinkronkan ke kedua versi CV dan konten bilingual sebelum dipublikasikan.

## 4. Chronos: arsip perjalanan enam bab

### 4.1 Komposisi ruang

Target visual dari titik masuk: portal arsip tinggi di sekitar `z = 7`, jalur cahaya yang melengkung melalui enam bab, dan peta konseptual di ujung `z < 0`. Hindari enam altar yang seragam dan ring lantai sebagai pusat seluruh ruang.

Usulan urutan awal: bab 1 di sisi kiri depan, bab 2 kanan depan, bab 3 kiri tengah, bab 4 kanan tengah, bab 5 kiri belakang, bab 6 kanan belakang; ujungnya peta alur pada sumbu tengah. Contoh pusat zona: `(-5, 5)`, `(5, 4)`, `(-5, 1)`, `(5, -1)`, `(-5, -5)`, `(5, -6)`. Jalur utama boleh berbentuk S, tetapi jangan mewajibkan pengunjung menempuhnya; semua bab tetap dapat dijangkau lewat waypoint dan berjalan bebas.

Elemen besar: portal masuk, enam bingkai arsip dengan profil berbeda, satu peta alur, garis arah lantai. Elemen tepi: rak atau panel arsip sebagai latar berulang yang dibatch/diinstansiasi; cukup rendah atau jauh dari jalur agar tidak menutup pembacaan. Gunakan cahaya hangat arsip dan aksen biru dingin untuk alur data; pencahayaan harus menyorot bab yang aktif tanpa membuat bab lain hilang.

### 4.2 Spesifikasi tiap bab

| ID / cerita | Bentuk dan lokasi fungsi | Aksi satu langkah | Hasil yang harus terlihat | Batas narasi |
| --- | --- | --- | --- | --- |
| C1 Validasi lintas negara | Gerbang dengan dua kartu “Tujuan A/B”; kiri depan. | Pilih salah satu tujuan ilustratif. | Kolom kebutuhan contoh berubah warna dan label hasil berubah. | Aturan contoh fiktif; jangan menyebut aturan negara nyata. |
| C2 Identitas rekening & IBAN | Panel dokumen transparan; kanan depan. | Pilih “format umum” atau “konteks IBAN”. | Bentuk field dan alasan validasi contoh berubah. | Jangan membuat validator IBAN yang diklaim berlaku universal. |
| C3 Entitas bank & cabang | Diagram node bercabang dengan bentuk institusi berbeda; kiri tengah. | Pilih “institusi lokal” atau “cabang luar negeri”. | Hubungan node dan keterangannya diperjelas. | Hubungan adalah ilustrasi konsep, bukan struktur OCBC. |
| C4 Routing korporasi | Panel percabangan besar; kanan tengah. | Pilih satu konteks transaksi contoh. | Satu jalur ke keputusan konseptual menyala; label alasan muncul. | Jangan menyatakan payment rail, sistem, atau keputusan produksi aktual. |
| C5 Integritas data finansial | Tiga bingkai berurutan yang mewakili tahap data; kiri belakang. | Aktifkan contoh “konsisten” atau “perlu ditinjau”. | Field yang perlu dicocokkan disorot; status ditulis jelas. | Jangan menampilkan data atau skema transaksi nyata. |
| C6 Investigasi & delivery | Meja kasus dan tiga kartu “gejala–pemeriksaan–verifikasi”; kanan belakang. | Pilih satu gejala ilustratif. | Jejak investigasi dan langkah verifikasi konseptual muncul. | Jangan menampilkan insiden, log, atau angka produksi nyata. |

**Peta pusat:** enam node mengikuti urutan cerita. Memilih bab dari objek, waypoint, atau daftar DOM menyalakan node terkait dan meredupkan node lain tanpa menyembunyikannya. Peta juga menunjukkan “1–6” dan status bab yang pernah dibuka selama kunjungan. Progres bersifat informatif, tidak mengunci cerita atau navigasi. Untuk pembaca layar, status aktif dan ringkasan peta muncul sebagai teks, bukan hanya warna.

### 4.3 Selesai bila

- Keenam cerita membuka teks yang sama dengan data sumber dan keenam bentuk dapat dibedakan dari jarak dekat maupun dari pintu masuk.
- Peta berubah segera saat bab dipilih lewat semua jalur interaksi; nomor dan judul aktif cocok dengan cerita yang terbuka.
- Jalur pesawat, area baca, dan peta bisa dicapai tanpa tersangkut collider. Tidak ada klaim internal bank baru.

## 5. Atlas: tujuh zona eksperimen

### 5.1 Komposisi ruang

Target visual: satu inti sistem rendah di tengah, tujuh perangkat pada dua sisi dan bagian belakang, dengan jalur data menuju inti. Dari titik masuk, perangkat harus terbaca sebagai meja, terminal, panel, dan miniatur yang berbeda. Lantai dapat memakai zona bidang material, bukan kisi yang sama dengan Chronos. Semua zona dapat dikunjungi tanpa urutan wajib.

Pembagian awal: sisi kiri untuk domain, event, dan data; sisi kanan untuk API, reliability, dan delivery; riset arsitektur di belakang sebagai titik simpulan. Inti tengah menjadi diagram hubungan, bukan objek baca kedelapan. Sediakan garis lantai ke setiap zona dengan label tetap. Satu kristal kecil boleh menandai inti atau salah satu perangkat, bukan tujuh objek utama.

### 5.2 Pola demo dan tujuh zona

Implementasikan **A1 lebih dahulu** sebagai pola acuan state, kontrol, teks hasil, perubahan bahasa, reduced motion, dan tombol “Baca lengkap”. Setelah pola tersebut berfungsi, buat enam zona berikutnya.

| ID / topik | Bentuk perangkat | Input tunggal | Output dan teks status |
| --- | --- | --- | --- |
| A1 Desain domain backend | Papan aturan dengan kartu konteks. | Pilih konteks A/B. | Kartu aturan terkait disorot; keterangan singkat menjelaskan pemisahan aturan bisnis. |
| A2 API & integrasi | Dua terminal dihubungkan jalur request. | Pilih contoh request valid/tidak valid. | Label “diterima” atau “perlu diperbaiki” beserta alasan contoh; tanpa kode HTTP fiktif yang tampak sebagai kontrak nyata. |
| A3 Komunikasi berbasis event | Tiga node producer–broker–consumer. | Pilih normal/tertunda. | Posisi/status event dan teks retry atau penundaan konseptual. |
| A4 Model data & query | Meja dengan tiga tabel contoh. | Pilih satu query contoh. | Tabel/relasi yang dipakai disorot; hasil berupa penjelasan, bukan angka performa. |
| A5 Keandalan & troubleshooting | Panel sinyal dan kartu gejala. | Pilih satu gejala. | Urutan pemeriksaan konseptual terlihat dan tertulis. |
| A6 Container & delivery | Jalur build–test–deploy. | Pilih “lolos” atau “gagal uji”. | Tahapan berhenti atau lanjut dengan label keputusan dan opsi rollback konseptual. |
| A7 Riset arsitektur | Dua miniatur berbeda: monolit dan hybrid. | Pilih prioritas evaluasi. | Trade-off relevan tersorot; tanpa menyatakan hasil ukur skripsi yang tidak ada pada CV. |

**Model state:** setiap demo memiliki `idle`, pilihan aktif, dan hasil teks. Perubahan pilihan tidak memulai timer wajib; partikel hanya menyertai perpindahan state. Bila pengguna berpindah zona, hasil zona lain boleh tetap ada selama kunjungan. Teks hasil ID/EN disimpan bersama data demo, bukan dirakit dari string visual.

### 5.3 Selesai bila

- Tujuh perangkat berbeda siluet dan tinggi; setiap demo selesai dengan satu pilihan dan satu hasil yang terbaca dalam beberapa detik.
- Perubahan bahasa memperbarui kontrol dan hasil aktif; reduced motion menampilkan hasil yang sama secara instan.
- Setiap demo terkait dengan satu cerita Atlas yang sudah ada. Cerita lengkap dan fallback teks tetap tersedia.

## 6. Station: pusat kendali komunikasi

### 6.1 Komposisi ruang

Bangun satu jendela orbital besar pada sisi belakang (`-Z`) atau sisi yang paling terlihat dari pintu masuk; beri bingkai kuat dan lapisan kaca ringan. Tempatkan konsol email di tengah depan, kira-kira dekat `(0, 1, 1)`. GitHub dan LinkedIn berada di panel samping kiri/kanan; jurnal CV di area belakang yang tetap mudah dicapai. Ini titik awal komposisi, bukan koordinat final.

Siluet utama harus terlihat sebelum detail: bingkai jendela, meja komunikasi pusat, dua terminal samping, dan rak jurnal. Tambahkan kursi, antena, kabel, dan lampu status hanya bila tidak mengganggu area baca atau menaikkan jumlah draw call berlebihan. Hindari empat meja identik dan hindari model baru yang berat bila bentuk prosedural sudah cukup.

### 6.2 Alur aksi

1. Pengunjung melihat ajakan singkat “Mari berkolaborasi / Let’s build together” di konsol email.
2. Saat mendekat, label menjelaskan bahwa tombol email akan membuka aplikasi surat. Tombol yang dapat menerima fokus menyediakan `mailto:` yang sama dengan `exhibits.js`.
3. Panel GitHub dan LinkedIn menampilkan ringkasan fungsi tautan dan nama tujuan sebelum dibuka; ikon panah dan teks menyatakan bahwa tautan keluar situs.
4. Jurnal CV menampilkan ringkasan riwayat dan membuka `cv.md` publik. Pastikan jalur relatif tetap benar saat situs di-host pada subfolder.
5. Bila `window.open()` atau handler email tidak membuka aplikasi di perangkat tertentu, tautan DOM yang nyata tetap tersedia dan alamat email dapat disalin atau dibaca.

### 6.3 Selesai bila

- Keempat tautan memakai URL sumber yang ada, memiliki label jelas, dan dapat diaktifkan dengan mouse, keyboard, serta sentuhan.
- Tidak ada objek dekoratif yang menutup konsol utama atau jalur ke pesawat; pemandangan luar angkasa tidak mengalahkan keterbacaan panel.
- Pengunjung memahami bahwa GitHub, LinkedIn, dan CV akan meninggalkan pengalaman 3D.

## 7. Urutan kerja yang dapat dieksekusi

| Tahap | Pekerjaan dan keluaran | Ketergantungan | Gerbang selesai |
| --- | --- | --- | --- |
| 0. Baseline | Catat tangkapan layar titik masuk tiga ruang, jumlah interaksi, ukuran build, dan perilaku desktop/mobile saat ini. Jalankan `npm run build`. | Tidak ada. | Referensi regresi tersimpan di catatan kerja; build awal berhasil. |
| 1. Fondasi ruang | Pisahkan lantai, cahaya, dan layout per destinasi; tetapkan ID cerita, struktur data demo, dan jalur masuk. | 0 | Ketiga ruang masih bisa dimasuki/pulang; semua cerita/tautan lama tetap terbuka. |
| 2. Komposisi besar | Bangun portal/jalur/peta Chronos, zona/inti Atlas, dan jendela/konsol Station. | 1 | Tiga siluet berbeda dari titik masuk tanpa membaca judul. |
| 3. Interaksi acuan | Buat pemilihan C1 ke peta, demo A1, dan konsol email Station lengkap dengan kontrol DOM dan dua bahasa. | 2 | Ketiganya bisa dipakai via mouse, keyboard, sentuh, dan reduced motion. |
| 4. Konten lengkap | Selesaikan C2–C6 dan A2–A7, ringkasan serta label ilustrasi, jurnal CV, dan tautan samping. | 3 | Enam + tujuh cerita tetap cocok dengan sumber; empat tautan benar. |
| 5. Penyempurnaan | Sesuaikan collider, pembacaan, pencahayaan, detail lingkungan, kualitas rendah, dan fallback teks. | 4 | Matriks uji di bagian 8 lulus. |
| 6. Publikasi | Perbarui `README.md` agar menggambarkan implementasi yang benar, lalu build dan tinjau `dist/`/GitHub Pages sebelum merge. | 5 | Dokumentasi dan artefak build konsisten. |

Urutan commit yang disarankan mengikuti tahap di atas. Setiap tahap harus menghasilkan kondisi aplikasi yang dapat dibangun dan ditinjau. Bila desain baru membuat route atau boarding rusak, selesaikan regresi itu sebelum memperluas detail visual.

## 8. Matriks verifikasi dan kriteria penerimaan akhir

### Pemeriksaan fungsional

- Buka langsung `#/chronos`, `#/atlas`, `#/station`, lalu masuk dari orbit; ulangi setelah reload dan setelah kembali dengan pesawat.
- Di Chronos buka C1–C6 lewat objek dan waypoint; pastikan nomor, judul, peta aktif, dan isi cerita cocok. Ulangi perpindahan bahasa saat cerita terbuka.
- Di Atlas jalankan pilihan pada A1–A7, baca teks hasil, buka cerita lengkap, kembali, lalu jalankan pilihan lain. Ulangi dengan motion mati.
- Di Station uji email, GitHub, LinkedIn, dan CV; periksa URL, target tab, label tujuan, dan akses keyboard.
- Coba berjalan dari titik masuk ke setiap objek dan kembali ke pesawat. Periksa sudut sempit, pinggir collider, objek yang menghalangi kamera, serta titik baca yang ditembus geometri.
- Uji versi teks bila WebGL tidak tersedia atau gagal: semua narasi dan empat tautan tetap ada; bila demo menjelaskan konsep tambahan, sediakan ringkasannya sebagai teks.

### Perangkat dan aksesibilitas

- Desktop keyboard saja: Tab, Shift+Tab, Enter/Space pada kontrol DOM, `E` pada objek, panah waypoint, Esc, dan tombol kembali. Fokus harus terlihat dan tidak terperangkap saat layar baca terbuka.
- Ponsel portrait dan landscape: joystick, drag melihat, tombol interaksi, pilihan demo, label yang tidak saling menutup, dan layar baca yang dapat digulir.
- Bahasa ID/EN: semua judul, instruksi, label contoh, hasil demo, status, dan teks pembaca layar berubah. Hindari teks penting yang hanya ditanam dalam tekstur 3D.
- Reduced motion: tidak ada kedipan atau partikel yang perlu ditunggu untuk memahami hasil; pilihan dan status berubah langsung. Kualitas rendah tetap menampilkan semua objek fungsional.
- Peta dan diagram dapat dipahami melalui teks, bentuk, atau status selain warna. Label “ilustrasi konseptual” terbaca tanpa hover.

### Kinerja dan build

- `npm run build` harus berhasil. Periksa console browser untuk error loading aset, warning shader, dan promise yang gagal.
- Bandingkan performa awal dan akhir pada perangkat desktop serta ponsel yang tersedia. Jika frame rate turun nyata, ukur draw call, jumlah lampu, bayangan, transparansi, geometri, dan tekstur sebelum menambah detail.
- Pakai material/geometry bersama atau instancing untuk rak, garis, dan panel berulang; batasi lampu yang menghasilkan shadow. Jangan menambah model ke `public/` tanpa memeriksa apakah `vite.config.js` perlu menyalinnya ke `dist/`.
- Tinjau ukuran `dist/` dan jalankan preview pada path relatif. Tidak ada aset yang hanya bekerja pada server dev.

### Definisi selesai

Pekerjaan dianggap selesai hanya ketika tiga identitas ruang terbaca dari titik masuk, seluruh 6 + 7 + 4 interaksi dan tautan berfungsi, tidak ada jalur yang terhalang, konten ID/EN dan fallback teks lengkap, contoh konseptual ditandai jelas, dan build produksi dapat dipakai. `README.md` diperbarui sesudah implementasi memenuhi kondisi tersebut.

## 9. Risiko dan keputusan yang perlu dijaga

| Risiko | Gejala | Pencegahan atau penyelesaian |
| --- | --- | --- |
| Collider baru menutup jalur atau mendorong kamera ke tempat salah | Pengunjung macet, teleport saat menepi, tidak bisa mencapai pesawat. | Tambahkan collider hanya untuk struktur yang perlu; uji lebar bersih dengan margin 0,35 dan lintasan boarding. |
| Terlalu banyak target interaktif | Waypoint menghitung dekorasi atau memilih objek di belakang. | Hanya cerita dan tautan utama masuk `interactables`; kontrol demo dikelola terpisah atau dipetakan eksplisit. |
| Panel baca terbalik/tertutup | Teks tidak terbaca setelah posisi cerita dipindah. | Pakai orientasi `screen` yang sesuai, ukur titik `visitExhibit()`, dan cek dari kamera desktop/mobile. |
| `window.open()` gagal membuka aplikasi email | Aksi email seolah tidak merespons. | Sediakan anchor `mailto:` yang nyata di HUD/versi teks dan tampilkan alamat sebagai teks. |
| Visual contoh terdengar seperti fakta bank | Pengunjung menyimpulkan aturan internal atau data nyata. | Label permanen, data fiktif, review kalimat terhadap CV sebelum publikasi. |
| Detail visual menurunkan performa | FPS turun, perangkat panas, shader bermasalah di kualitas rendah. | Selesaikan komposisi dengan primitive murah dahulu; batch bentuk berulang dan ukur sebelum menambah efek. |

## 10. Peta file saat implementasi

- `src/space/worlds.js` dan modul world baru bila perlu: susunan ruang, item utama, collider, cahaya, dan pendaftaran animasi.
- `src/space/design.js`: primitive geometri dan material yang dapat dipakai ulang.
- `src/space/interactions.js`: kontrak item baca/tautan, marker, fokus, layar baca, dan collision; ubah hanya bila interaksi baru memang membutuhkannya.
- `src/space/main.js`, `src/space/style.css`: kontrol demo DOM, status aksesibel, teks bilingual UI, dan akses tautan yang dapat menerima fokus.
- `src/space/banking-notes.js`, `src/space/exhibits.js`: cerita dan tautan sumber; tambah data ringkasan ilustrasi secara terpisah tanpa mengubah klaim pengalaman.
- `src/space/landing.js`, `src/space/universe.js`: titik referensi regresi untuk masuk, berjalan, waypoint, kualitas, reduced motion, dan pulang; ubah hanya bila desain ruang memerlukan penyesuaian terukur.
- `vite.config.js`: daftar aset produksi bila ada aset baru.
- `README.md`: deskripsi akhir setelah implementasi, bukan saat tahap rencana.
