# Rencana Pengembangan Chronos, Atlas, dan Station

Dokumen ini menyimpan rancangan untuk pengembangan berikutnya setelah reset. **Ini adalah rencana, belum implementasi.** Fokusnya mengurangi ruang kosong dan pola yang terasa berulang, sambil mempertahankan fungsi setiap destinasi dalam portofolio 3D.

## Kondisi saat rencana dibuat

- **Chronos** (`#/chronos`) menampilkan enam tema pengalaman overseas banking sebagai altar dan patung memori yang tersusun melingkar.
- **Atlas** (`#/atlas`) menampilkan tujuh topik keahlian sebagai kristal magnetik yang tersusun melingkar.
- **Station / satelit** (`#/station`) menampilkan empat tautan kontak dan CV di atas meja yang tersusun seperti grid.
- Ketiganya memakai dasar ruang berupa lantai kotak dan penanda interaksi yang serupa. Banyak ruang di antara objek utama belum memiliki fungsi visual atau interaksi.
- Konten tersedia dalam bahasa Indonesia dan Inggris. Penjelasan pengalaman Chronos mengikuti CV; visualisasi tambahan tidak boleh menyatakan detail implementasi internal bank yang tidak diketahui.

## Prinsip desain bersama

1. Beri setiap destinasi **bentuk ruang, ritme perjalanan, dan aktivitas** yang berbeda. Jangan mengisi ruang kosong dengan banyak objek dekoratif yang sama.
2. Mulai dari elemen berskala besar yang terlihat dari titik masuk: struktur ruang, pusat perhatian, perubahan ketinggian, dan pencahayaan. Detail kecil menyusul.
3. Pertahankan jalur berjalan yang jelas, area baca yang lapang, serta akses ke semua interaksi dengan mouse, keyboard, dan layar sentuh.
4. Tiap elemen visual sebaiknya membantu menjelaskan isi portofolio atau mengarahkan pengunjung. Animasi tidak boleh mengganggu keterbacaan.
5. Jaga performa di perangkat rendah dan dukung preferensi reduced motion. Konten penting tetap tersedia melalui versi teks portofolio.

## Chronos — arsip pengalaman

**Gagasan utama:** pengunjung mengikuti perjalanan melalui enam bab pengalaman, bukan mengitari enam patung yang bentuk dan jaraknya seragam.

### Tata ruang

- Ubah susunan enam artefak menjadi **jalur linimasa** yang berawal dari pintu masuk dan berakhir di pusat arsip. Jalur dapat melengkung atau membentuk rangkaian ruang kecil; tidak harus lurus.
- Jadikan setiap bab sebuah **ruang arsip** dengan siluet khas: gerbang, rak arsip, panel kaca, proyeksi, atau struktur data. Variasikan ukuran, ketinggian, dan orientasinya.
- Tempatkan sebuah **peta alur transaksi lintas negara** di pusat atau ujung jalur sebagai simpul yang menghubungkan keenam bab.
- Isi tepi ruangan dengan rak arsip bertingkat, panel transparan, garis navigasi lantai, dan cahaya terarah. Sisakan area bebas di sekitar artefak agar pembacaan nyaman.

### Isi enam bab

1. **Validasi lintas negara:** proyeksi beberapa tujuan dengan aturan ilustratif yang berbeda.
2. **Identitas rekening dan IBAN:** bentuk dokumen atau kartu identitas rekening dengan contoh data fiktif.
3. **Entitas bank dan cabang:** diagram hubungan institusi, entitas luar negeri, dan cabang.
4. **Routing transaksi korporasi:** jalur bercabang yang memperlihatkan bagaimana konteks memengaruhi keputusan.
5. **Integritas data finansial:** aliran data yang tetap konsisten saat melewati beberapa tahap.
6. **Investigasi dan delivery:** meja investigasi dengan jejak peristiwa, pengujian, dan status penyelesaian yang bersifat ilustratif.

### Interaksi

- Saat bab dipilih, nyalakan bagian terkait pada peta pusat dan redupkan jalur lain. Tampilkan ringkasan singkat sebelum membuka cerita lengkap.
- Gunakan progres perjalanan yang ringan, misalnya enam indikator bab, tanpa mewajibkan pengunjung membuka semuanya.
- Semua skenario, formulir, dan data transaksi harus diberi konteks **ilustrasi/fiktif**; jangan mengklaim alur, aturan, atau angka internal OCBC.

## Atlas — laboratorium keahlian

**Gagasan utama:** keahlian ditunjukkan melalui demonstrasi kecil dengan bentuk perangkat yang berbeda, bukan tujuh kristal identik dengan teks berbeda.

### Tata ruang

- Bagi laboratorium menjadi beberapa **zona eksperimen** yang mengelilingi satu meja atau inti sistem. Gunakan meja, panel vertikal, pipa data, layar, dan proyeksi dengan tinggi berbeda.
- Hubungkan zona melalui jalur cahaya atau aliran data yang menuju inti. Ruang kosong menjadi bagian dari diagram sistem yang bisa dijelajahi.
- Pertahankan kristal hanya sebagai aksen atau inti energi pada beberapa zona, bukan wadah utama semua topik.

### Tujuh demonstrasi yang disarankan

| Topik saat ini | Bentuk visual dan interaksi singkat |
| --- | --- |
| Desain domain backend | Papan aturan yang mengelompokkan konteks bisnis dan keputusan validasi. Pengunjung memilih satu konteks ilustratif. |
| API dan integrasi | Dua terminal terhubung; request bergerak melalui validasi lalu menghasilkan response atau error yang mudah dipahami. |
| Komunikasi berbasis event | Jalur producer–broker–consumer dengan event yang bergerak, termasuk contoh retry atau keterlambatan. |
| Model data dan query | Meja relasi data; pilih query contoh untuk menyorot tabel dan hubungan yang dipakai. |
| Keandalan dan troubleshooting | Panel sinyal operasional; pilih gejala lalu ikuti jejak menuju penyebab ilustratif. |
| Container dan delivery | Jalur build–test–deploy dengan status tahapan dan opsi rollback konseptual. |
| Riset arsitektur | Dua miniatur sistem, monolit dan desain hybrid, dengan penjelasan trade-off tanpa klaim angka performa baru. |

### Interaksi

- Satu aksi sederhana per zona sudah cukup. Demonstrasi harus dapat dipahami dalam beberapa detik, dengan tombol untuk membaca penjelasan lengkap.
- Teks hasil demonstrasi harus tetap tersedia dalam bahasa Indonesia dan Inggris.
- Jangan menjadikan animasi sebagai satu-satunya cara memahami diagram; sediakan label dan status yang jelas.

## Station / satelit — pusat komunikasi

**Gagasan utama:** ini adalah penutup perjalanan sekaligus undangan berkolaborasi, bukan sekadar empat meja tautan.

### Tata ruang

- Bentuk ruang sebagai **pusat kendali orbital** dengan jendela besar menghadap luar angkasa, satu konsol komunikasi utama, dan beberapa area pendukung.
- Jadikan **email** aksi utama pada konsol pusat. Tempatkan GitHub dan LinkedIn sebagai layar atau terminal samping, sedangkan CV sebagai jurnal misi yang dapat dibuka.
- Beri perbedaan bentuk pada tiap area: antena atau proyektor pesan, monitor kode, panel jaringan, dan rak jurnal. Hindari pengulangan empat meja identik.
- Tambahkan detail yang memberi skala dan suasana: bingkai jendela, lampu status, kabel, kursi operator, panel kendali, dan cahaya dari luar. Prioritaskan objek yang terlihat dari pintu masuk.

### Interaksi

- Saat mendekati konsol utama, tampilkan pesan undangan singkat dan pilihan jelas untuk mengirim email.
- Layar GitHub dan LinkedIn dapat memperlihatkan pratinjau fungsi tautan sebelum dibuka. Jurnal CV dapat menampilkan ringkasan isi.
- Tautan eksternal dan email tetap mudah diakses lewat keyboard dan layar sentuh, serta jelas kapan pengunjung akan meninggalkan situs.

## Urutan pengerjaan

1. **Ubah komposisi besar:** linimasa Chronos, zona Atlas, serta jendela dan konsol utama Station. Ini prioritas tertinggi karena langsung mengubah kesan repetitif.
2. **Tambahkan satu interaksi khas per destinasi:** peta bab Chronos, satu demonstrasi Atlas sebagai pola acuan, dan pesan konsol Station.
3. Lengkapi variasi enam bab Chronos dan tujuh zona Atlas, lalu tambahkan detail lingkungan secukupnya.
4. Sesuaikan pencahayaan, audio bila memang dibutuhkan, performa perangkat rendah, reduced motion, bahasa, dan aksesibilitas.
5. Tinjau seluruh perjalanan dari titik masuk hingga keluar: arah jalan harus jelas, objek tidak menghalangi, teks dapat dibaca, dan setiap tempat terasa berbeda.

## Titik implementasi saat melanjutkan

- `src/space/worlds.js`: tata ruang, model, animasi, collider, dan interaksi Chronos, Atlas, Station.
- `src/space/design.js`: bentuk prosedural, material, cahaya, dan perangkat visual yang dapat dipakai ulang.
- `src/space/interactions.js`: penanda, fokus, dan pembukaan cerita/interaksi.
- `src/space/banking-notes.js`: isi Chronos dan Atlas dalam dua bahasa.
- `src/space/exhibits.js`: data cerita dan tautan Station.
- `README.md`: perbarui deskripsi destinasi setelah perubahan benar-benar diterapkan.

## Kriteria selesai

- Dari titik masuk, siluet dan fungsi Chronos, Atlas, dan Station dapat dibedakan tanpa membaca label.
- Ruang kosong memiliki tujuan sebagai jalur, area demonstrasi, pemandangan, atau ruang baca; tidak terasa seperti lantai yang belum diisi.
- Artefak utama dalam satu destinasi tidak tampak seperti salinan yang hanya berbeda warna atau teks.
- Seluruh cerita dan tautan tetap bisa ditemukan dan digunakan pada desktop serta ponsel.
- Konten ilustratif dibedakan dari pengalaman kerja nyata; tidak muncul klaim baru tentang sistem internal bank atau hasil riset yang belum didukung sumber.
