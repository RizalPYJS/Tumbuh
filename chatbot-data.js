// Jawaban kurasi untuk chatbot demo lokal; bukan AI generatif atau sumber diagnosis.
window.CHATBOT_KB = {
  welcome: "Halo, saya Asisten Tumbuh. Saya dapat membantu menjawab pertanyaan umum tentang kurva pertumbuhan, ide menu, anggaran, dan Posyandu.",
  intents: [
    {
      id: "greeting",
      keywords: ["hai", "halo", "selamat pagi", "selamat siang", "selamat malam", "assalamualaikum"],
      answer: "Hai, Ibu! Mau tanya soal menu, anggaran, atau cara membaca grafik pertumbuhan?"
    },
    {
      id: "growth_chart",
      keywords: ["grafik kia", "grafik pertumbuhan", "baca kurva", "garis kurva", "z score", "zscore", "grafik berat", "grafik tinggi"],
      answer: "Buka tab Tumbuh, lalu masukkan usia, jenis kelamin, berat, dan panjang/tinggi. Grafik memplot catatan anak di atas kurva rujukan WHO menurut usia dan jenis kelamin, mirip cara membaca kurva di Buku KIA. Garis kurva adalah rujukan, bukan diagnosis. Bila ragu, cocokkan dengan Buku KIA dan tanyakan ke kader atau tenaga kesehatan."
    },
    {
      id: "weight_reference",
      keywords: ["berat ideal", "berat normal", "berat badan ideal", "berat badan normal", "berapa berat", "bb ideal"],
      answer: "Tidak ada satu angka berat yang cocok untuk semua anak. Rujukan bergantung pada usia dan jenis kelamin, dan berat-menurut-usia saja tidak cukup untuk menilai status gizi. Masukkan hasil ukur di tab Tumbuh untuk melihatnya pada kurva WHO, lalu konfirmasi dengan tenaga kesehatan."
    },
    {
      id: "height_reference",
      keywords: ["tinggi ideal", "tinggi normal", "panjang badan", "berapa tinggi", "anak pendek", "tinggi badan"],
      answer: "Rujukan panjang/tinggi berbeda menurut usia dan jenis kelamin; tidak ada satu angka ideal untuk semua anak. Pada grafik Tumbuh, kurva WHO membantu membandingkan catatan dari waktu ke waktu. Cara ukur juga berbeda: panjang badan berbaring untuk anak di bawah 2 tahun dan tinggi berdiri mulai usia 2 tahun. Bukan diagnosis. Diskusikan hasil dengan tenaga kesehatan."
    },
    {
      id: "weight_concern",
      keywords: ["berat tidak naik", "berat badan tidak naik", "bb tidak naik", "berat turun", "berat badan turun", "berat susah naik"],
      answer: "Aku tidak bisa menentukan penyebab berat tidak naik lewat chat. Catat hasil timbang beserta tanggalnya, bawa Buku KIA, lalu konsultasikan ke Posyandu, Puskesmas, atau dokter. Jika anak tampak sangat lemas atau sulit minum, cari bantuan medis segera."
    },
    {
      id: "picky_eating",
      keywords: ["susah makan", "pilih pilih", "pilih-pilih", "mogok makan", "tidak mau makan", "gak mau makan", "ga mau makan", "makan lama"],
      answer: "Situasi ini bisa bikin khawatir. Coba tawarkan makanan dengan tenang, beri waktu makan yang teratur, dan hindari memaksa anak menghabiskan makanan. Kamu bisa mencari ide pengganti di tab Menu; tekstur dan porsinya perlu disesuaikan dengan anak. Bila mogok makan berlanjut atau kamu khawatir, bicarakan dengan tenaga kesehatan."
    },
    {
      id: "menu_ideas",
      keywords: ["menu", "resep", "bahan makanan", "bahan menu", "makan apa", "ide makan", "cara membuat"],
      answer: "Buka tab Menu untuk melihat seluruh ide resep. Cari berdasarkan nama atau bahan, lalu saring menurut kelompok bahan atau waktu makan. Setiap kartu memuat bahan, porsi perkiraan, waktu memasak, estimasi harga, dan cara membuat."
    },
    {
      id: "budget",
      keywords: ["anggaran", "budget", "hemat", "murah", "mahal", "biaya makan", "harga menu"],
      answer: "Tanyakan langsung, misalnya ‘menu hemat’ atau ‘menu di bawah Rp10 ribu’. Jawaban akan menampilkan resep dari katalog beserta estimasi harga per resep. Harga dapat berbeda menurut wilayah dan kondisi pasar."
    },
    {
      id: "different_advice",
      keywords: ["saran berbeda", "saran beda", "bingung harus mengikuti", "informasi berbeda", "saran internet", "mana yang benar"],
      answer: "Wajar merasa bingung saat mendapat saran berbeda. Untuk kondisi dan kebutuhan anak, tanyakan langsung ke dokter, bidan, kader, atau tenaga kesehatan yang memeriksa anak. Catat pertanyaan dan bawa Buku KIA agar pembahasannya lebih mudah."
    },
    {
      id: "posyandu",
      keywords: ["posyandu", "buku kia", "puskesmas", "kader", "hasil timbang"],
      answer: "Posyandu dapat membantu mencatat berat dan panjang/tinggi anak serta membahas Buku KIA. Bawa catatan ukur sebelumnya agar trennya bisa dilihat bersama kader atau tenaga kesehatan. Grafik di aplikasi ini hanya pendamping dan tidak menggantikan pemeriksaan."
    },
    {
      id: "milk_supplement",
      keywords: ["susu", "vitamin", "suplemen", "4 sehat 5 sempurna", "empat sehat"],
      answer: "Kebutuhan susu atau suplemen berbeda-beda. Prototype ini tidak menganggap susu wajib untuk semua anak dan tidak menyarankan suplemen tertentu. Tanyakan ke tenaga kesehatan yang mengetahui usia, pola makan, dan kondisi anak."
    },
    {
      id: "food_allergy",
      keywords: ["alergi makanan", "alergen", "ruam makanan", "gatal setelah makan", "reaksi makanan"],
      answer: "Aku tidak bisa memastikan alergi lewat chat. Periksa bahan pada menu dan bicarakan reaksi yang muncul dengan tenaga kesehatan. Jika setelah makan anak sulit bernapas atau wajah/bibirnya membengkak, segera cari pertolongan darurat."
    },
    {
      id: "urgent_symptoms",
      keywords: ["sesak", "sulit bernapas", "susah bernapas", "kejang", "pingsan", "tidak sadar", "darurat", "bibir biru"],
      answer: "Gejala seperti sulit bernapas, kejang, pingsan, atau tidak sadar perlu pertolongan segera. Hubungi layanan darurat setempat atau bawa anak ke IGD sekarang. Jangan menunggu jawaban chatbot."
    }
  ],
  fallback: "Maaf, saya hanya dapat membantu topik gizi balita, menu makanan, kurva pertumbuhan, dan Posyandu. Saya tidak dapat menjawab pertanyaan di luar cakupan tersebut. Untuk keluhan kesehatan khusus, silakan hubungi tenaga kesehatan."
};
