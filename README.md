# Tumbuh — pendamping pertumbuhan dan menu anak

Prototype statis mobile-first/PWA untuk menguji alur pencatatan pertumbuhan, menu, dan tanya-jawab. Fitur lokal tidak memerlukan API key; analisis foto belum aktif sampai endpoint model dihubungkan.

## Menjalankan

Buka `index.html` di browser untuk mencoba fitur lokal. Untuk mengaktifkan Diskusi bersama, jalankan `node server.mjs`. Untuk memasang di HP dan memakai Diskusi lintas perangkat, deploy website dan backend ke hosting HTTPS yang sama, lalu pilih **Pasang aplikasi** atau **Tambahkan ke Layar Utama**. Profil dan catatan timbang tetap tersimpan di browser/perangkat.

## Alur yang bisa diuji

1. **Beranda → Tumbuh:** pilih jenis kelamin untuk langsung melihat kurva WHO. Saat usia, berat, dan panjang/tinggi diisi, titik pratinjau ikut muncul; simpan untuk menambahkannya ke riwayat. Ada grafik terpisah untuk berat-menurut-usia dan panjang/tinggi-menurut-usia, dengan garis z-score −3 sampai +3.
2. **Tanya AI:** tanyakan ide menu, misalnya “sarapan dengan telur” atau “menu hemat di bawah Rp10 ribu”. Chatbot mengambil resep dari dataset lokal dan menyertakan bahan serta estimasi biaya.
3. Tanya juga tentang kurva pertumbuhan, susah makan, anggaran, atau Posyandu; jawaban umum dicocokkan dari bank tanya-jawab lokal.
4. **Diskusi:** feed menampilkan postingan dan thread balasan dengan pseudonim `User 1`, `User 2`, dan seterusnya. Form untuk membuat postingan baru tidak ditampilkan; balasan pada thread tersedia.
5. **Konsultasi:** jelajahi dan filter kategori dokter anak, dokter gizi klinik, ahli gizi, dokter gigi anak, konselor laktasi, serta psikolog anak.

## Server Diskusi

Jalankan `node server.mjs` dengan Node.js yang mendukung modul bawaan `node:sqlite`. Secara default server lokal berjalan di `http://127.0.0.1:4173` dan menyimpan pesan ke `data/community.sqlite`. Untuk dipakai lintas perangkat, deploy backend dan website pada layanan HTTPS yang dapat dijangkau pengguna.

Ruang diskusi ini memakai ID acak lokal untuk pseudonim, bukan akun terverifikasi. Belum ada penghapusan pesan oleh pengguna atau moderasi. Gunakan hanya untuk pengujian; jangan deploy ke publik sebelum menambahkan autentikasi, pelaporan/moderasi, kebijakan penyimpanan, dan perlindungan spam yang sesuai.

## Hubungan dengan temuan Empathize

Wawancara dengan Ibu Siti, Ibu Melani, dan Ibu Wulan menunjukkan tiga pola yang muncul pada ketiganya: grafik Buku KIA sulit dipahami, anak kadang pilih-pilih/susah makan, serta menu praktis dan biaya makanan menjadi pertimbangan. Karena itu aplikasi menyediakan pencatatan tren dan tanya-jawab menu dengan bahan, waktu, serta estimasi harga.

Temuan lain yang dipertimbangkan: narasumber mencakup ibu bekerja dan ibu rumah tangga, anak usia 1–4 tahun, serta kota dan desa. Harga menu adalah estimasi contoh, bukan data pasar. Aplikasi tidak menyimpulkan status gizi atau menggantikan Buku KIA/tenaga kesehatan.

## Batasan data dan keamanan informasi

- Semua harga, porsi, dan resep adalah contoh untuk uji alur, bukan rekomendasi gizi tervalidasi atau harga pasar. “4 sehat 5 sempurna” tidak digunakan sebagai klaim; label bahan bukan perhitungan gizi dan susu tidak dianggap wajib.
- Dataset berat dan panjang/tinggi menurut usia (12–60 bulan, jenis kelamin terpisah) diturunkan dari tabel z-score WHO. Grafik menampilkan kurva −3 sampai +3 SD, tetapi tidak menetapkan status atau diagnosis. Sebelum 24 bulan standar memakai panjang badan; mulai 24 bulan memakai tinggi berdiri.
- Standar WHO: [Weight-for-age](https://www.who.int/tools/child-growth-standards/standards/weight-for-age) dan [Length/height-for-age](https://www.who.int/tools/child-growth-standards/standards/length-height-for-age). Dataset dimuat lokal; tidak memerlukan API key atau koneksi internet.
- File dataset aplikasi: `growth-reference-data.js` untuk kurva WHO dan `menu-data.js` untuk 32 ide resep.
- Tanya-jawab teks memakai pencocokan frasa lokal dan tidak menyimpan percakapan; bukan AI generatif atau tenaga kesehatan. Unggah foto menampilkan pratinjau lokal. Untuk analisis sungguhan, hubungkan endpoint model independen di `food-analysis-config.js`; endpoint menerima `multipart/form-data` dengan field `image` dan mengembalikan `items` serta `total` nutrisi. Foto tidak dikirim saat endpoint belum dikonfigurasi. Simpan kredensial model hanya di server, bukan di JavaScript browser.
- `model-prompts/IDENTITY.md`, `SKILL.md`, dan `AGENTS.md` adalah instruksi untuk model yang akan dihubungkan nanti; chatbot lokal saat ini belum memuatnya.
- Sign up/sign in saat ini membuat profil lokal berbasis nama dan email di perangkat ini saja; email tidak diverifikasi dan tidak ada kata sandi/sinkronisasi. Aplikasi tetap dapat dipakai tanpa membuat profil.
- Data tersimpan lokal di browser; jangan masukkan informasi sensitif untuk demonstrasi publik.
- Tiga wawancara adalah riset awal dengan sampel kecil, bukan gambaran semua keluarga.
