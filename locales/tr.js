export default {
  app: {
    name: 'parolla',
    domain: 'parolla.app',
    description: 'Günlük soruları çöz ve rekabete katıl. Quiz oluştur, oyuncuların oluşturduğu quizleri çöz',
    publisher: 'Selim Doyranlı',
    copyright: '{logo} {spacer} {text}'
  },
  error: {
    error: 'Hata',
    anErrorOccurred: 'Bir hata oluştu',
    tryAgain: 'Tekrar dene',
    goToHome: 'Ana sayfaya git',
    unAuthorized: 'Yetkisiz erişim',
    loginRequired: 'Giriş yapınız',
    mediaError: {
      uploadFailed: 'Medya yükleme hatası',
      limitExceeded: 'Medya boyutu sınırı aşıldı',
      mimeTypeNotAllowed: 'İzin verilmiyen medya tipi',
      extensionNotAllowed: 'İzin verilmiyen uzantıya sahip medya'
    },
    tooManyLines: 'En fazla {max} satır olabilir',
    textTooLong: 'Bazı satırlar 64 karakterden uzun',
    tooManyFiles: 'En fazla {max} dosya seçebilirsiniz',
    invalidYoutubeLinks: 'Bazı linkler geçersiz, lütfen kontrol edin',
    choicesLength: 'En az {min}, en fazla {max} seçim eklemelisin',
    flashcardListLength: 'Kart listesi en az {min}, en fazla {max} kart olmalıdır',
    rateLimited: 'Çok hızlı işlem yapıyorsunuz.\n {seconds} saniye sonra tekrar deneyin.'
  },
  economy: {
    retry: 'Tekrar dene',
    earned: {
      incomplete: 'Ödül için tüm harfleri tamamla ya da süreyi bitir.',
      capped: 'Günlük tavana ulaştın',
      questDone: 'Görev tamamlandı: {title}',
      viewQuests: 'Görevler',
      guestTeaser: 'Giriş yapsaydın {amount} kazanacaktın',
      login: 'Giriş yap'
    },
    inventory: {
      title: 'Envanter',
      tabs: { inventory: 'Envanter', shop: 'Mağaza', quests: 'Görevler' }
    },
    quests: {
      loginPrompt: 'Görevleri görmek için giriş yap.',
      title: 'Görevler',
      daily: 'Günlük görevler',
      weekly: 'Haftalık görevler',
      claim: 'Al',
      reroll: 'Yenile',
      chestTitle: 'Haftalık altın hediyesi',
      chestHint: 'Tüm haftalık görevleri al',
      claimed: '+{amount} altın kazandın',
      rerolled: 'Görev yenilendi',
      chestClaimed: 'Sandıktan +{amount} altın'
    },
    errors: {
      'insufficient-gold': 'Yeterli altının yok',
      'already-claimed': 'Bu ödül zaten alındı',
      'reroll-used': 'Bugünkü yenileme hakkını kullandın',
      'limit-reached': 'Limite ulaşıldı',
      'already-owned': 'Bu ürüne zaten sahipsin',
      'not-for-sale': 'Bu ürün satışta değil',
      'vitrin-expired': 'Bu ürünün vitrin indirimi sona erdi',
      'nothing-to-buy': 'Bu sette alınacak ürün kalmadı',
      'not-completed': 'Görev henüz tamamlanmadı',
      'key-reused': 'Bu istek zaten kullanıldı, tekrar dene',
      'loadout-too-fast': 'Çok hızlı değiştiriyorsun, biraz bekle',
      'bad-key': 'Geçersiz istek',
      'not-assigned': 'Bu görev sana atanmamış',
      'no-replacement': 'Bu görev için yenisi bulunamadı',
      completed: 'Bu görev zaten tamamlandı',
      'not-ready': 'Henüz hazır değil',
      'unknown-item': 'Ürün bulunamadı',
      'invalid-slot': 'Geçersiz kuşanma yuvası',
      generic: 'Bir şeyler ters gitti, tekrar dene'
    },
    achievements: {
      title: 'Başarımlar',
      goal: {
        'alfabe-ustasi': 'Günlük modu {n} kez bitir',
        kusursuz: 'Günlük modu {n} kez hatasız ve passız bitir',
        'kelime-avcisi': '{n} kelimeblok çöz',
        'keskin-goz': "{n} kelimeblok'u en fazla 2 denemede çöz",
        'tek-atis': "{n} kelimeblok'u ilk denemede çöz",
        turcu: 'Turda toplam {n} puan topla',
        mimar: 'Quizlerini {n} farklı oyuncu oynasın',
        'quiz-yaraticisi': 'Herkese açık {n} quiz oluştur',
        sadik: '{n} günlük giriş serisine ulaş',
        koleksiyoncu: '{n} kozmetiğe sahip ol',
        'profil-fotografi': 'Profiline fotoğraf ekle',
        firstLegendary: 'İlk efsanevi kozmetiğini al'
      },
      note: {
        'profil-fotografi': 'Avatar yerine yüklediğin fotoğrafı kullanman yeterli.',
        'quiz-yaraticisi': 'Quizin kurallara uyuyorsa sayılır, 1 saat içinde otomatik kontrol edilir.'
      }
    },
    dailyReward: 'Günlük ödül: +{amount} altın (seri {streak})',
    collection: {
      title: 'Envanter',
      preview: 'Önizleme',
      equip: 'Kuşan',
      unequip: 'Çıkar',
      equipped: 'Kuşanıldı',
      unequipped: 'Çıkarıldı',
      previewOpen: 'Önizle',
      empty: 'Henüz hiç ürünün yok.',
      goShop: 'Mağazaya git',
      loginPrompt: 'Envanterini görmek için giriş yap.',
      login: 'Giriş yap'
    },
    history: {
      title: 'Altın geçmişi',
      balance: 'Bakiye',
      more: 'Daha fazla',
      empty: 'Henüz altın hareketin yok.',
      loginPrompt: 'Altın geçmişini görmek için giriş yap.',
      reasons: {
        signup: 'Hoş geldin bonusu',
        early: 'Erken kullanıcı bonusu',
        daily_login: 'Günlük giriş',
        play_daily: 'Günlük quiz',
        play_wordblock: 'Kelimeblok',
        play_tour: 'Turnuva',
        play_room: 'Oda',
        creator: 'Oda yapımcısı ödülü',
        daily_top: 'Günün en iyileri',
        quest: 'Görev',
        quest_chest: 'Haftalık sandık',
        achievement: 'Başarım',
        purchase: 'Satın alma',
        set_purchase: 'Set satın alma',
        reroll: 'Görev yenileme',
        streak_freeze: 'Günlük seri dondurucu',
        season: 'Sezon ödülü',
        admin: 'Yönetici işlemi'
      }
    },
    shop: {
      title: 'Mağaza',
      vitrin: 'Günün vitrini',
      products: 'Ürünler',
      login: 'Giriş yap',
      equippedLabel: 'Kuşanılı',
      buySet: 'Seti al',
      owned: 'Sahipsin',
      original: 'Orijinal',
      price: 'Fiyat',
      balance: 'Bakiyen',
      balanceAfter: 'Satın alma sonrası',
      confirm: 'Onayla',
      equip: 'Kuşan',
      equipped: 'Kuşandın',
      equipFailed: 'Satın alındı ama kuşanılamadı, tekrar dene.',
      purchased: 'Satın alındı',
      setContent: 'Setteki sahip olmadığın {count} ürünün hepsi alınır.',
      insufficient: 'Yeterli altının yok. Bakiyen: {balance}, eksik: {missing}',
      rarity: { siradan: 'Sıradan', nadir: 'Nadir', epik: 'Epik', efsanevi: 'Efsanevi', sezon: 'Sezon' },
      categories: {
        all: 'Tümü',
        avatar_frame: 'Avatar çerçevesi',
        avatar_decoration: 'Avatar dekorasyonu',
        profile_effect: 'Profil efekti',
        profile_frame: 'Profil çerçevesi',
        profile_cover: 'Profil arkaplanı',
        name_color: 'İsim rengi',
        sets: 'Setler'
      },
      freeze: {
        title: 'Günlük seri dondurucu',
        desc: 'Bir gün kaçırırsan serin bozulmaz.',
        note: 'Bir gün oynamayı kaçırırsan günlük giriş serin bozulmaz. En fazla {max} tane taşıyabilirsin.',
        full: 'Dolu'
      }
    }
  },
  success: {
    success: 'Başarılı'
  },
  general: {
    loading: 'Yükleniyor',
    yes: 'Evet',
    no: 'Hayır',
    ok: 'Tamam',
    cancel: 'Vazgeç',
    save: 'Kaydet',
    apply: 'Uygula',
    question: 'Soru',
    answer: 'Cevap',
    option: 'Seçenek',
    remove: 'Kaldır',
    delete: 'Sil',
    edit: 'Düzenle',
    open: 'Aç',
    close: 'Kapat',
    playAgain: 'Baştan oyna',
    stats: 'İstatistik',
    dailyStats: 'Bugünün istatistiği',
    share: 'Paylaş',
    by: 'tarafından',
    comments: 'Yorumlar',
    noData: 'Veri yok',
    filter: 'Filtrele',
    sort: 'Sırala',
    ad: 'Reklam',
    send: 'Gönder',
    playNow: 'Hemen Oyna',
    play: 'Oyna',
    joined: 'Katıldı',
    anon: 'anonim',
    refresh: 'Tazele',
    draft: 'Taslak',
    quiz: 'Quiz',
    photoQuiz: 'Foto quiz',
    triviaQuiz: 'Trivia',
    thisOrThatQuiz: 'O mu bu mu?',
    flashcardsQuiz: 'Flashcards',
    provider: 'Sağlayıcı',
    quizPreparing: 'Quiz hazırlanıyor',
    loadMore: 'Daha fazla'
  },
  auth: {
    accountBlocked: 'Hesabın sistem tarafından kapatıldı',
    google: {
      callback: {
        redirecting: 'Yönlendiriliyorsun, lütfen bekle...',
        ifNoRedirect: 'Bu sayfada takılı kaldıysan anasayfaya gitmek için <a href="/" title="kelime oyunu">buraya tıkla</a>'
      }
    },
    error: {
      title: 'Giriş yapılamadı, tekrar dene'
    },
    dialog: {
      list: {
        title: 'Giriş yaparak',
        item1: {
          title: 'Quiz oluştur'
        },
        item2: {
          title: 'Quizleri değerlendir'
        },
        item3: {
          title: 'Skor tablosunda yer al'
        },
        item4: {
          title: 'Tur modunu oyna'
        },
        item5: {
          title: 'Sohbete katıl'
        }
      }
    }
  },
  introScene: {
    title: 'Kelime oyunu',
    subtitle: 'Günlük kelime oyunu',
    description: 'Günlük soruları çöz ve rekabete katıl. Quiz oluştur, oyuncuların oluşturduğu quizleri çöz',
    modeList: {
      daily: {
        title: 'GÜNLÜK',
        heading: 'GÜNLÜK KELİME OYUNU',
        description: 'Bugünün soru setini oyna ve rekabete katıl ya da sadece bilgini sına',
        todaysBestScoreLabel: 'Günün lideri',
        todaysBestScore: '{label} {player}',
        playDaily: 'Günlük Oyna',
        playUnlimited: 'Limitsiz Oyna'
      },
      unlimited: {
        title: 'LİMİTSİZ'
      },
      creator: {
        title: 'YARATICI',
        description: 'Quiz oluştur, oyuncuların oluşturduğu quizleri çöz',
        label: 'Bugün {count} quiz çözüldü',
        todaysQuizLabel: 'Günün quizi',
        playButtonText: 'Tüm Quizler: Oyna'
      },
      tour: {
        title: 'TUR',
        description: 'Her tur bir soruyu cevapla, anlık rekabet',
        liveCount: `{count} aktif oyuncu`,
        label: 'CANLI',
        todaysBestScoreByLabel: 'tarafından',
        todaysBestScoreLabel: 'Bugünün en iyi skoru',
        todaysBestScore: `{label} {by} {byLabel} {score} puan`
      },
      wordblock: {
        title: 'KELİMEBLOK',
        description: 'Günün kelimesini tahmin et, günlük kelime oyunu',
        label: 'Bugün {count} kez oynandı',
        todaysBestScoreLabel: 'Günün lideri',
        todaysBestScore: '{label} {player}'
      },
      music: {
        title: 'MÜZİK',
        description: 'Şarkıları dinle ve tahmin et',
        label: 'Dilediğin sanatçıya ait şarkılar'
      },
      draw: {
        title: 'ÇİZ',
        description: 'Verilen kelimeyi çiz , çizimi tahmin et',
        label: 'CANLI',
        newLabel: 'Yeni'
      }
    }
  },
  gameScene: {
    pendingQuestions: 'Sorular getiriliyor',
    answerField: {
      placeholder: 'Cevabı yaz',
      submit: 'GÖNDER',
      pass: 'PAS'
    },
    correct: 'Doğru',
    wrong: 'Yanlış',
    pass: 'Pas',
    remainTime: 'Kalan süre',
    elapsedTime: 'Geçen süre',
    scoreStats: 'Skor dağılımı',
    answerKey: 'Cevap anahtarı',
    correctAnswer: 'Doğru cevap',
    yourAnswer: 'Senin cevabın',
    gamerAnswer: 'Oyuncunun cevabı',
    halfTime: 'Sürenin yarısı doldu',
    timeOver: 'Süre doldu',
    allQuestionsSeen: 'Aklına bir cevap gelmezse süreyi beklemene gerek yok, bitir yazıp bitirebilirsin de',
    unsupportedHeight: 'Daha iyi bir deneyim için daha büyük bir ekranda oynamalısın',
    toast: {
      startGame: {
        title: 'Bilmende fayda var',
        description: '<ul> <li>Oyunu erkenden sonlandırmak istersen <code>bitir</code> yazıp gönderebilirsin.</li> </ul>'
      }
    },
    skipAdShowScore: 'Reklamı geç ve skorunu gör ⇥',
    error: {
      fetchQuestions: {
        description: 'Sorular getirilirken sorun çıktı',
        action: 'Tekrar dene'
      },
      notStartsWithActiveChar: 'CEVAP YUKARDAKİ KARAKTERLE ({activeChar}) BAŞLAMALI'
    }
  },
  dialog: {
    addChoices: {
      title: 'Seçim ekle',
      tab: {
        photo: 'Fotoğraf',
        youtube: 'YouTube',
        text: 'Yazı'
      },
      placeholder: {
        youtube: 'https://www.youtube.com/watch?v=abc1\nhttps://www.youtube.com/watch?v=abc2',
        text: 'Seçim 1\nSeçim 2\nSeçim 3'
      },
      selectSystemFiles: 'Dosya seç',
      selectedCount: '{count} adet foto seçildi',
      useFilenameAsMediaNote: 'Dosya isimlerini açıklama olarak kullan'
    },
    menu: {
      title: 'Daha fazla',
      goldHistory: 'Altın geçmişi',
      usernameEdit: 'Oyuncu adını değiştir',
      menu: 'Menü',
      profileEdit: 'Profili düzenle',
      profileView: 'Profili görüntüle',
      myQuizzes: 'Quizlerim',
      darkTheme: 'Koyu tema',
      soundFx: 'Ses Efektleri',
      reactionSoundFx: 'Tepki Sesleri',
      reactionSoundFxDesc: 'Tıklama, klavye, popup gibi tepki sesleri için',
      gameSceneSoundFx: 'Oyun Sahnesi Sesleri',
      gameSceneSoundFxDesc: 'Doğru, yanlış, pas ve süre gibi sahne sesleri için',
      wordblockKeyboard: 'Kelimeblok Klavyesi',
      switchLocale: 'Dil değiştir',
      suggestQa: 'Soru önermek ister misin?',
      howToPLay: 'Nasıl oynanır?',
      howToCalculateStats: 'Skoru nasıl hesaplıyoruz',
      shareRoom: `Quiz'i paylaş`,
      reviewRoom: `Quiz'i değerlendir`,
      shareApp: `parolla'yı paylaş`,
      credits: 'Yapımcılar',
      contact: 'Bize ulaşın',
      legal: 'Yasal',
      privacyPolicy: 'Gizlilik Politikası',
      cookiePolicy: 'Çerez Politikası',
      kvkk: 'KVKK Aydınlatma Metni',
      termsOfUse: 'Kullanım Koşulları'
    },
    howToCalculateStats: {
      title: 'Skoru nasıl hesaplıyoruz',
      description:
        'Cevabın doğru ise doğru sorulara yanlış ise yanlış sorulara eklenir. <br><br> Eğer süren bittiğinde hala paslanmış soruların varsa bunlar da pasladığın sorulara eklenir. <br><br> Ve tüm toplam sonuç oyun bittiğinde istatistik ekranında gösterilir.'
    },
    credits: {
      title: 'Yapımcılar',
      description: '<a href="https://kozmos.works" rel="noopener" target="_blank">KOZMOS (kozmos.works)</a>'
    },
    contact: {
      title: 'Bize ulaşın',
      description:
        'Öneri, şikayet ya da işbirliği için; <br><br> <a href="mailto:parollaapp@gmail.com?subject=parolla_contact">parollaapp@gmail.com</a> <br> veya <br> <a href="https://twitter.com/parollaapp" target="_blank">@parollaapp</a> <br> twitter hesabımızdan ulaşabilirsin.'
    },
    report: {
      title: 'Şikayet',
      scope: {
        label: 'Kapsam',
        placeholder: 'Şikayet kapsamı'
      },
      detail: {
        label: 'Detay',
        placeholder: 'Şikayetinizi açıklayın'
      },
      media: {
        label: 'Görseller (isteğe bağlı)',
        hint: 'görsel',
        uploading: 'Yükleniyor'
      },
      reportedUser: {
        label: 'Raporlanan oyuncu'
      },
      reportedMessage: {
        label: 'Raporlanan mesaj'
      },
      additional: {
        label: 'Ek bilgi'
      },
      submit: 'Gönder',
      callback: {
        success: 'Şikayetiniz başarıyla gönderildi',
        error: 'Şikayet gönderilemedi'
      }
    },
    createQuizSelection: {
      title: 'Quiz oluştur',
      quizType: {
        qa: {
          title: 'Soru-Cevap (Klasik)',
          description: 'Oyuncular eklediğin sorulara cevap verir',
          label: 'Zamana karşı klasik soru-cevap quiz',
          createQaQuiz: 'Soru-Cevap quiz oluştur'
        },
        thisOrThat: {
          title: 'O mu bu mu?',
          description: 'Seçim listesi oluştur, oyuncular her tur iki seçenekten birini seçer',
          label: 'Rekabet yok, kişisel tercihleri belirler',
          createThisOrThatQuiz: 'O mu bu mu? quiz oluştur'
        },
        flashcards: {
          title: 'Flashcards',
          description: 'Çalışma ya da eğlence için ön ve arka yüzü olan kartlar oluştur',
          label: 'Öğrenme ya da eğlence',
          createFlashcardsQuiz: 'Flashcards quiz oluştur'
        }
      }
    },
    createdRoom: {
      title: 'Quiz oluşturuldu',
      quizUpdated: 'Quiz güncellendi',
      joinRoom: 'Quize git',
      isListedMessage: `Quizin {isListed}.`,
      public: '<strong>QUIZ LİSTESİNDE GÖRÜNECEK</strong> şekilde oluşturuldu',
      private:
        '<strong>QUIZ LİSTESİNDE GÖRÜNMEYECEK</strong> şekilde oluşturuldu, ama quiz bağlantını bilen arkadaşların hala quizine girebilir',
      copyUrl: {
        callback: {
          success: 'Quiz bağlantısı kopyalandı'
        }
      }
    },
    mediaUpload: {
      title: 'Medya yükle',
      uploadArea: {
        addMultiplePhoto: 'Çoklu fotoğraf ekle',
        description: 'Cihazından dosya seç veya sürükleyip bırak'
      },
      selectFile: 'Medya seç',
      selectPhotoOrVideo: 'Fotoğraf ya da video seç',
      tabs: {
        file: 'Dosya',
        youtube: 'YouTube'
      },
      youtubeUrl: {
        label: 'URL',
        placeholder: 'https://www.youtube.com/watch?v=...',
        error: "Geçerli bir YouTube URL'si giriniz"
      }
    },
    howToPlay: {
      title: 'parolla nasıl oynanır?',
      description: `
        Her karaktere karşılık gelen sorunun cevabını bulmalısın, cevap o karakter ile başlar.<br><br>
        Örneğin: <strong>Bal yapan hayvan?</strong> sorusunda aktif karakter <strong>A</strong> ve bunun cevabı <strong>Arı</strong>'dır gibi.<br><br>
        Cevabın <strong>🟩 Doğru</strong> ya da <strong>🟥 Yanlış</strong> olabilir. <br> Eğer cevabı bilmiyorsan <strong>🟨 PAS</strong>
        butonuna bas ya da pas yazıp gönder. Daha sonra o soruya dönebileceksin. Pasladığın soruları süren bitene kadar cevaplayabilirsin.
        <br><br> Oyunun toplam süresi <strong>{gameTimeLimitMinutes} dakika</strong>'dır.
        <br><small>Eğer sayfayı yenilersen oyun en baştan başlar</small>`,
      body: `
        {description}
        {extra}
        `,
      daily: {
        extra: '<strong>parolla</strong> oyunu <strong>{questionCount}</strong> türkçe alfabe harfi içerir. Her gün yeni sorular gelir.'
      },
      unlimited: {
        extra:
          '<strong>parolla</strong> oyunu <strong>{questionCount}</strong> türkçe alfabe harfi içerir. <br> Bu modu tekrar tekrar oynayabilirsin. Her defasında farklı sorular gelir'
      },
      creator: {
        thisOrThat: {
          title: 'O mu bu mu? quiz nasıl oynanır?',
          description: 'Her tur iki seçenek arasından seçim yap',
          extra: '{choiceCount} seçim var. Bu modu tekrar tekrar oynayabilirsin.'
        },
        flashcards: {
          title: 'Flashcards',
          description: 'Bu quizde <strong>{cardCount} flashcard</strong> var.',
          extra: 'Kartı çevirmek için üzerine dokun. Kartlar arasında geçiş yapmak için okları kullan.'
        },
        description: `
        Her karaktere karşılık gelen sorunun cevabını bulmalısın, cevap o karakter ile başlar.
        <br><br> Oyunun toplam süresi <strong>{gameTimeLimitMinutes} dakika</strong>'dır.
        <br><small>Eğer sayfayı yenilersen oyun en baştan başlar</small>`,
        descriptionTrivia: `
        Her sorunun doğru cevabını bulmalısın.
        <br><br> Oyunun toplam süresi <strong>{gameTimeLimitMinutes} dakika</strong>'dır.
        <br><small>Eğer sayfayı yenilersen oyun en baştan başlar</small>`,
        preparedBy: 'Hazırlayan',
        extra: '{questionCount} soru ve {questionCount} cevap var. Bu modu tekrar tekrar oynayabilirsin.'
      },
      tour: {
        extra: `
        Her karaktere karşılık gelen sorunun cevabını bulmalısın, cevap o karakter ile başlar.<br><br>
        Örneğin: <strong>Bal yapan hayvan?</strong> sorusunda aktif karakter <strong>A</strong> ve bunun cevabı <strong>Arı</strong>'dır gibi.<br><br>
        <strong>parolla</strong> tur modu aynı anda birden fazla oyuncunun her turda aynı soruyu gördüğü ve aynı doğru cevabı vermeye çalıştığı, her tur sorunun değiştiği ve her tur oyuncuların doğru cevabı vermeye çalışıp puan topladığı bir oyun modudur.<br><br>
        Her tur <strong>30</strong> saniyedir ve her tur doğru cevabı vermek için <strong>3</strong> hakkın vardır.`
      },
      cancelButtonText: 'Kapat ve Başla',
      wordblock: {
        title: 'parolla kelimeblok nasıl oynanır?',
        heading: 'Günün Kelimesini Bul',
        guessRule: `Her tahmin {charLength} harfli doğru bir kelime olmalıdır. Göndermek için enter'a bas.`,
        attemptsRule:
          'Her tahminden sonra kutucukların renkleri tahmininin yakınlığına göre değişecektir. {maxAttempts} tahmin hakkın var.',
        examplesLabel: 'Örnekler',
        example: {
          correct: 'harfi kelimede var ve doğru yerde.',
          present: 'harfi kelimede var fakat yanlış yerde.',
          absent: 'harfi kelimede yok.'
        },
        footer: 'Her gün yeni bir kelime gelir!'
      }
    },
    stats: {
      clipboard: {
        score: {
          callback: {
            success: 'Skorun kopyalandı'
          }
        }
      },
      empty: {
        description: 'Oyun bittiğinde <br> istatistik burada görünecek.',
        answerKey: 'Oyun bittiğinde <br> cevap anahtarı burada görünecek.'
      },
      daily: {
        nextGame: 'Sonraki oyun'
      },
      won: {
        title: 'Tebrikler!',
        description: '{attempts}. tahmininde <strong>{targetWord}</strong> kelimesini buldun.',
        attempts: {
          one: 'Tek attın be!',
          two: 'Helal, kaçar öyle bi tane boşver',
          three: 'Efsosun',
          four: 'Gayet iyi',
          five: 'Eh işte'
        }
      },
      lost: {
        title: 'Oyun bitti!',
        description: 'Malesef <strong>{targetWord}</strong> kelimesini bulamadın.'
      }
    },
    interstitialAd: {
      title: 'Reklam desteğiyle bunu sürdürüyoruz'
    },
    localeSwitch: {
      title: 'Dil değiştir',
      switching: 'Değiştiriliyor'
    },
    leave: {
      title: 'Onaylıyor musun?',
      description: 'Yaptığın şeyleri tekrar yapmak zorunda kalabilirsin'
    },
    roomReview: {
      title: 'Quiz değerlendirmeleri'
    },
    playerActions: {
      title: 'Daha fazla ({username})',
      showProfile: 'Profili Göster',
      report: 'Raporla',
      voteKick: 'Odadan atmak için oyla'
    },
    tourModeOnline: {
      title: 'Tur'
    },
    auth: {
      title: 'Giriş yap',
      login: 'Giriş yap',
      register: 'Kayıt ol',
      loginWithGoogle: 'Google ile Giriş Yap',
      loginWithApple: 'Apple ile Giriş Yap'
    },
    player: {
      title: 'Profil',
      myBio: 'Hakkımda',
      tourScore: {
        title: 'Tur modu skorları',
        loading: 'Tur skorları getiriliyor',
        callback: {
          error: {
            title: 'Tur skorları getirilemedi',
            action: 'Tekrar dene'
          }
        }
      },
      loading: 'Oyuncu bilgileri getiriliyor',
      callback: {
        error: {
          title: 'Oyuncu bilgileri getirilemedi',
          action: 'Tekrar dene'
        }
      }
    },
    avatarEditor: {
      title: 'Avatar düzenle',
      livePreview: 'Canlı Önizleme',
      mouth: 'Ağız',
      eyes: 'Gözler',
      eyebrows: 'Kaşlar',
      hair: 'Saç Modeli',
      hairColor: 'Saç Rengi',
      earrings: 'Küpeler',
      features: 'Özellikler',
      glasses: 'Gözlükler',
      featureOptions: {
        none: 'Yok',
        birthmark: 'Ben',
        blush: 'Allık',
        freckles: 'Çiller',
        mustache: 'Bıyık'
      },
      skinColor: 'Cilt Rengi',
      backgroundColor: 'Arkaplan Rengi'
    },
    profilePhotoEditor: {
      title: 'Profil Fotoğrafı',
      selectFile: 'Dosya Seç',
      change: 'Değiştir',
      hint: 'JPG, PNG, GIF veya WEBP — en fazla 5 MB',
      error: {
        mimeTypeNotAllowed: 'Bu dosya tipi desteklenmiyor',
        sizeLimitExceeded: 'Dosya 5 MB sınırını aşıyor',
        cropFailed: 'Fotoğraf işlenemedi'
      }
    },
    deleteProfilePhoto: {
      title: 'Profil fotoğrafını sil',
      message: 'Yüklediğin profil fotoğrafı kalıcı olarak silinecek. Devam etmek istiyor musun?'
    },
    guestDrawer: {
      title: 'Misafir Profili',
      regenerateAvatar: 'Avatarı Yenile',
      regenerateName: 'Rastgele',
      confirm: 'Onayla',
      usernameLabel: 'Kullanıcı Adı'
    },
    drawRoomClosed: {
      hostLeftTitle: 'Host odadan ayrıldı',
      hostLeftHint: 'Oda kapatıldı. Lobiye dönebilirsin.',
      emptyTitle: 'Oda kapatıldı',
      emptyHint: 'Odada kimse kalmadı.',
      backToLobby: 'Lobiye Dön'
    },
    enterPassword: {
      title: 'Şifreli Oda',
      hint: 'Bu odaya katılmak için şifreyi gir.',
      placeholder: 'Oda şifresi',
      confirm: 'Katıl',
      cancel: 'Vazgeç',
      wrongPassword: 'Şifre yanlış. Tekrar dene.'
    }
  },
  clipboard: {
    copy: 'Kopyala',
    callback: {
      success: 'Panoya kopyalandı',
      error: 'Bir sorun oluştu ve kopyalanmadı'
    }
  },
  sharer: {
    app: {
      description: `parolla - Kelime oyunu\n\n\Günlük soruları çöz ve rekabete katıl. Quiz oluştur, oyuncuların oluşturduğu quizleri çöz \n\nhttps://www.parolla.app`
    },
    room: {
      description: `parolla - Kelime oyunu \n\n"{roomTitle}" quizini çöz! \n \n{url}`
    },
    dailyModeStats: {
      description: `parolla - Kelime oyunu \n\n{day} \n\n🟩 {correctAnswerCount} Doğru \n🟥 {wrongAnswerCount} Yanlış \n🟨 {passedAnswerCount} Pas \n \nKalan Süre: {remainTime} \n \n{url}`
    },
    unlimitedModeStats: {
      description: `parolla - Kelime oyunu \n\n(Limitsiz oyun modu) \n\n🟩 {correctAnswerCount} Doğru \n🟥 {wrongAnswerCount} Yanlış \n🟨 {passedAnswerCount} Pas \n \nKalan Süre: {remainTime} \n \n{url}`
    },
    creatorModeStats: {
      description: `parolla - Kelime oyunu \n\n"{roomTitle}" quizini çözdüm \n\n🟩 {correctAnswerCount} Doğru \n🟥 {wrongAnswerCount} Yanlış \n🟨 {passedAnswerCount} Pas \n \nKalan Süre: {remainTime} \n \n{url}`
    },
    wordblockModeStats: {
      description: `parolla - Kelime oyunu \n\nKelimeblok modunda skorum ({charLength} harf)\n\n{attempts}. deneme / {maxAttempts} tahmin hakkı\n\n{cells}\n\nGeçen Süre: {elapsedTime} \n \n{url}`
    },
    guessTheSongStats: {
      description: `parolla - Müzik quiz'de {artists} şarkılarını tahmin ettim \n \nSkorum: {score} \n \n{url}`
    }
  },
  creatorModeRooms: {
    title: 'QUIZLER',
    joinRoom: {
      typeUrl: 'QUIZ BAĞLANTISINI GİR',
      url: {
        action: 'QUIZE GİT'
      }
    },
    divider: 'YA DA',
    rooms: {
      pendingRooms: 'Quizler getiriliyor',
      selectFromList: 'LİSTEDEN SEÇ',
      filters: {
        title: 'SIRALA',
        recently: 'En yeni quizler',
        oldest: 'En eski quizler',
        byViewCount: 'En çok oynanan quizler'
      },
      refresh: 'TAZELE',
      searchField: {
        searchRoom: {
          placeholder: 'Quiz ara'
        },
        searchRoomOrTag: {
          placeholder: 'Quiz ya da #etiket ara'
        }
      },
      empty: {
        description: 'Quiz bulunamadı, hemen quiz oluştur!',
        action: 'Quiz oluştur'
      }
    },
    error: {
      rooms: {
        fetch: {
          description: 'Quizler getirilirken bir sorun çıktı',
          action: 'Tekrar dene'
        }
      },
      joinRoom: 'Quize gidilemedi, lütfen girdiğin bağlantıyı kontrol et'
    }
  },
  creatorModeMyRooms: {
    title: 'Son oluşturduğum quizler',
    description: {
      authed: '',
      nonAuthed: '* Son oluşturduğun quizler tarayıcı belleğine kaydedilir, tarayıcı verileri sıfırlandığında bu liste temizlenir'
    },
    delete: {
      deleting: 'Quiz siliniyor...',
      callback: {
        success: 'Quiz silindi'
      }
    },
    listing: {
      public: 'Listede',
      private: 'Liste dışı'
    }
  },
  flashcardScene: {
    front: 'ÖN YÜZ',
    back: 'ARKA YÜZ',
    flip: 'Çevir',
    tapToFlip: 'Kartı çevirmek için dokun',
    more: {
      title: 'Daha fazla',
      shuffle: {
        label: 'Karıştır'
      },
      watchlist: {
        label: 'İzleme listesi',
        stillProgress: 'Dizide',
        inMemory: 'Tekrar gösterme',
        complete: 'Görünecek başka kart yok'
      }
    }
  },
  choices: {
    remainingChoices: '{count} seçim kaldı',
    lastChoice: 'Son seçim',
    winner: {
      title: 'KAZANAN SEÇİM',
      winnerChoices: {
        title: 'En çok seçilenler'
      }
    }
  },
  form: {
    isRequired: '{model} gereklidir',
    isInvalid: '{model} geçersiz',
    optionalHint: '(isteğe bağlı)',
    creatorModeCompose: {
      title: 'QUIZ OLUŞTUR',
      choicesTitle: 'SEÇİM QUIZ OLUŞTUR',
      flashcardsTitle: 'FLASHCARDS QUIZ OLUŞTUR',
      clearForm: 'Formu Temizle',
      roomInformations: 'QUIZ BİLGİLERİ',
      qaSet: 'SORU-CEVAP SETİ',
      choicesSet: 'TERCİH SETİ',
      creatingQuiz: 'Quiz oluşturuluyor...',
      updatingQuiz: 'Quiz güncelleniyor...',
      uploadingMedia: 'Medya yükleniyor',
      room: {
        roomTitle: {
          label: 'Quiz başlığı',
          placeholder: 'Quiz başlığı yaz'
        },
        coverPhoto: {
          label: 'Kapak fotoğrafı',
          uploaderTitle: 'Kapak fotoğrafı ekle',
          uploaderDescription: 'Tıkla ve görsel seç, 16:9 oranında kırpılır',
          hint: 'Kapak fotoğrafı olan quizler daha çok dikkat çekiyor, eklemende fayda var.',
          error: {
            mimeTypeNotAllowed: 'İzin verilen formatlar: JPG, PNG, GIF, WEBP',
            sizeLimitExceeded: 'Maksimum dosya boyutu: 5 MB',
            cropFailed: 'Kapak fotoğrafı işlenemedi',
            uploadFailed: 'Kapak fotoğrafı yüklenemedi'
          }
        },
        description: {
          label: 'Açıklama',
          placeholder: 'Quiz hakkında kısa bir açıklama...'
        },
        moderation: {
          note: 'Moderasyon notu',
          source: 'Kaynak',
          sources: {
            admin: 'Moderatör',
            ai: 'Yapay zeka'
          }
        },
        isListed: {
          label: 'Quizler listesinde görünsün mü?',
          systemRemoved: 'Bu quiz gözden geçirildi, quizler listesinde olması uygun değil ve listeden çıkarıldı.'
        },
        isAnon: {
          label: 'Adın gizlensin mi?'
        },
        tag: {
          label: 'Etiketler',
          placeholder: 'Etiket yaz',
          hint: 'Etiket eklemek quizini öne çıkarır aramalarda daha kolay bulunur.'
        },
        gameTimeLimit: {
          label: 'Oyun süresi',
          minutes: 'Dakika',
          seconds: 'Saniye'
        }
      },
      qa: {
        empty: {
          description: 'Quizin şu anda boş',
          action: 'Soru ekle'
        },
        question: {
          photo: 'Fotoğraf',
          video: 'Video',
          photoOrVideo: 'Fotoğraf/Video',
          addMedia: 'Medya ekle',
          addPhoto: 'Fotoğraf ekle',
          addVideo: 'Video ekle',
          questionType: {
            title: 'Soru tipi',
            options: {
              text: 'Yazı',
              media: 'Fotoğraf'
            }
          },
          label: 'Soru',
          placeholder: 'Soruyu yaz',
          mediaNote: {
            label: 'Fotoğraf notu',
            placeholder: 'Fotoğraf notunu yaz (isteğe bağlı)',
            description: 'Oyuncuya fotoğraf ile ilgili notun gösterilir'
          },
          videoNote: {
            label: 'Video notu',
            placeholder: 'Video notunu yaz (isteğe bağlı)',
            description: 'Oyuncuya video ile ilgili notun gösterilir'
          },
          removeQuestion: 'Soruyu kaldır',
          changeType: {
            title: 'Tip değişsin mi?',
            description: 'Bu soruya ait girdiğin veriler kaybolacak',
            confirm: 'Değiştir',
            cancel: 'İptal'
          },
          error: {
            mediaRequired: 'Fotoğraf tipindeki soruda dosya eksik'
          }
        },
        answer: {
          answerType: {
            title: 'Cevap tipi',
            options: {
              textField: 'Yazı',
              trivia: 'Trivia'
            },
            trivia: {
              description: 'Oyuncu hazırladığın cevaplar arasından seçecek',
              optionPlaceholder: 'Seçenek yaz',
              addOption: 'Seçenek ekle',
              correctOption: 'Doğru cevap belirlendi'
            }
          },
          label: 'Cevap',
          placeholder: 'Cevapları virgül ile ayırabilirsin',
          error: {
            nonMatched: 'Her cevap aynı karakterle başlamalı',
            required: 'Cevap alanı zorunludur'
          }
        },
        character: {
          label: 'Karakter',
          placeholder: 'Soru karakteri'
        },
        addMoreQuestion: 'Başka soru ekle'
      },
      choices: {
        choiceType: 'Seçim tipi',
        type: {
          text: 'Yazı',
          media: 'Fotoğraf',
          youtube: 'YouTube'
        },
        placeholder: {
          text: 'Seçim metnini yaz',
          youtube: 'YouTube bağlantısını yapıştır'
        },
        addMedia: 'Fotoğraf Ekle',
        empty: {
          description: 'Henüz bir seçim eklemedin\nEn az 8 seçim, en fazla 256 seçim eklenebilir',
          action: 'Seçim ekle'
        },
        addMore: {
          action: 'Başka seçim ekle',
          addMultiple: 'Toplu seçim ekle'
        },
        removeChoice: 'Seçimi kaldır',
        changeType: {
          title: 'Tip değişsin mi?',
          description: 'Bu seçime ait girdiğin veriler kaybolacak',
          confirm: 'Değiştir',
          cancel: 'İptal'
        }
      },
      flashcards: {
        set: 'KART SETİ',
        card: 'Kart',
        front: {
          label: 'Ön yüz',
          placeholder: 'Kartın ön yüz metni'
        },
        back: {
          label: 'Arka yüz',
          placeholder: 'Kartın arka yüz metni'
        },
        removeCard: 'Kartı kaldır',
        empty: {
          description: 'Henüz kart eklemedin\nEn az 1, en fazla 100 kart eklenebilir',
          hint: 'Oyun ekranında kartların arka yüzü önce gösterilir',
          action: 'Kart ekle'
        },
        addMore: {
          action: 'Yeni kart ekle'
        }
      },
      saveDraft: {
        action: 'Taslak kaydet',
        callback: {
          success: 'Taslak olarak kaydedildi'
        }
      },
      termsDescription:
        '* Quiz oluştururken spam, illegal ve nsfw içeriklerden kaçının. Bu gibi quizler moderasyon tespitinde silinecektir. Quiz oluştururken IP adresiniz yasal mevzuat gereği saklanır. İhlal durumunda yasal yaptırım uygulanabilir.',
      submit: 'Bitir ve yayınla',
      error: {
        couldNotCreate: 'Quiz oluşturulamadı, lütfen kontrol edip tekrar dene'
      }
    },
    creatorModeEdit: {
      title: 'QUIZ DÜZENLE',
      choicesTitle: 'SEÇİM QUIZ DÜZENLE',
      flashcardsTitle: 'FLASHCARDS QUIZ DÜZENLE',
      submit: 'Güncelle ve yayınla'
    },
    usernameEdit: {
      usernameField: {
        placeholder: 'Oyuncu adını yaz'
      },
      submit: 'Kaydet',
      callback: {
        success: 'Oyuncu adın değiştirildi'
      },
      error: {
        submit: 'Bu oyuncu adı uygun değil lütfen başka yaz'
      }
    },
    profileEdit: {
      usernameField: {
        label: 'Kullanıcı Adı',
        placeholder: 'Kullanıcı adını yaz'
      },
      fullnameField: {
        label: 'Ad Soyad',
        placeholder: 'Ad soyadını yaz'
      },
      bioField: {
        label: 'Kendini tanıt',
        placeholder: 'Hakkında bir şeyler yaz'
      },
      callback: {
        success: 'Profil bilgileriniz güncellendi'
      },
      avatarSource: {
        label: 'Kullan',
        diceBear: 'Avatar',
        profilePhoto: 'Profil Fotoğrafı'
      },
      uploadPhotoButton: 'Profil Fotoğrafı Yükle',
      editAvatarButton: 'Avatar Düzenle',
      deletePhotoButton: 'Sil',
      deletePhotoCallback: {
        success: 'Profil fotoğrafı silindi'
      },
      deactivate: {
        title: 'Hesabı Sil',
        description:
          'Hesabını sildiğinde verilerin yasal mevzuat gereği 90 gün boyunca sistemde saklanır. Bu süre içinde tekrar giriş yaparsan hesabın yeniden aktifleşir; giriş yapmazsan 90 günün ardından hesabın ve tüm verilerin kalıcı olarak silinir.',
        button: 'Hesabımı Sil',
        confirmTitle: 'Hesabını silmek istediğine emin misin?',
        confirmBody:
          'Hesabın yasal mevzuat gereği 90 gün boyunca saklanacak. Bu süre içinde tekrar giriş yaparsan hesabın yeniden aktifleşir; giriş yapmazsan 90 günün ardından kalıcı olarak silinir.',
        confirmCta: 'Evet, Sil'
      }
    }
  },
  comments: {
    title: 'Yorumlar',
    filter: { comments: 'Yorumlar', ratings: 'Puanlar' },
    placeholder: 'Bir yorum yaz...',
    loginPlaceholder: 'Yorum yapmak için giriş yap',
    send: 'Gönder',
    reply: 'Yanıtla',
    loadMoreReplies: 'Daha fazla yanıt yükle',
    deleted: 'Bu yorum silindi',
    quizOwner: 'Quiz sahibi',
    report: 'Raporla',
    delete: 'Sil',
    deleteConfirm: 'Bu yorumu silmek istediğine emin misin?',
    like: 'Beğen',
    replies: 'Yanıtlar',
    replyingTo: '{username} adlı kişiye yanıt veriliyor',
    rateLimited: 'Çok hızlı yorum yapıyorsun. 5 dakika sonra tekrar dene.',
    moreTitle: 'Yorum seçenekleri',
    empty: 'Henüz yorum yok. İlk yorumu sen yap!',
    ratingsEmpty: 'Henüz puan verilmedi',
    yourRating: 'Puanın: {rating}',
    rateThisQuiz: 'Bu quizi puanla',
    ratingCount: '({count} oyuncu puan verdi)',
    rated: 'Puanın kaydedildi',
    alreadyRated: 'Bu quizi zaten puanladın',
    error: 'Bir şeyler ters gitti, tekrar dene'
  },
  notifications: {
    title: 'Bildirimler',
    tabs: { all: 'Tümü', quizzes: 'Quizlerim', interactions: 'Etkileşimler' },
    empty: 'Henüz bildirim yok',
    andOthers: '{name} ve {count} kişi',
    types: {
      room_rated: '{actor} quizine {rating} puan verdi',
      room_commented: '{actor} quizine yorum yaptı',
      comment_replied: '{actor} yorumuna yanıt verdi',
      reply_replied: '{actor} yanıtına yanıt verdi',
      comment_liked: '{actor} yorumunu beğendi',
      reply_liked: '{actor} yanıtını beğendi'
    }
  },
  ownerStats: {
    views: 'Görüntülenme',
    players: 'Oynayan',
    rating: 'Ortalama puan',
    comments: 'Yorum',
    avgCorrect: 'Ort. doğru',
    avgWrong: 'Ort. yanlış',
    avgPassed: 'Ort. pas',
    avgRemain: 'Ort. kalan süre'
  },
  scoreboard: {
    scoreboard: 'Skor tablosu',
    pendingScoreboard: 'Skorlar getiriliyor',
    loginToBeInScoreboard: '<u>Giriş yaptıktan</u> sonra oynarsan quize ait skor tablosunda yer alırsın',
    loginToBeInScoreboardExtra: 'Giriş yapmadan oynarsan skorunu sadece sen görebilirsin'
  },
  gmPanel: {
    title: 'GM Paneli',
    menu: 'GM Paneli',
    date: 'Tarih',
    copy: 'Kopyala',
    empty: 'Bu tarihte anomali yok',
    blocked: 'Engelli',
    blockUser: 'Oyuncuyu engelle',
    deleteScores: 'Skorlarını sil',
    deleteScore: 'Skorunu sil',
    confirmBlockUser: '{username} engellensin mi? Hesabı kapatılır.',
    confirmDeleteScores: '{username} oyuncusunun skoru silinsin mi?',
    anomalyCount: '{count} anomali tespit edildi',
    notifyTitle: 'Oyuncuya bildirim metni',
    actionDone: 'İşlem tamamlandı',
    commands: {
      title: 'Komut Paneli',
      description: 'GM komutlarını buradan çalıştır. Her komut kayıt altına alınır.',
      help: 'Komutlar',
      userArg: 'kullanıcı',
      amountArg: 'miktar',
      noteArg: 'not',
      sendgoldHelp: 'Kullanıcıya altın gönderir (1 - 100.000). Not isteğe bağlı.',
      example: 'Örnek',
      placeholder: '/sendgold kullanici 500 hediye',
      run: 'Çalıştır',
      sent: '{username} kullanıcısına {amount} gönderildi • yeni bakiye {balance}',
      logs: 'Komut kayıtları',
      noLogs: 'Henüz komut çalıştırılmadı',
      more: 'Daha fazla',
      ok: 'Başarılı',
      error: 'Hata',
      errors: {
        'unknown-command': 'Bilinmeyen komut',
        'missing-username': 'Kullanıcı adı gerekli',
        'invalid-amount': 'Miktar 1 ile 100.000 arasında tam sayı olmalı',
        'user-not-found': 'Kullanıcı bulunamadı',
        'ambiguous-user': 'Bu ada büyük/küçük harf farkıyla birden fazla kullanıcı uyuyor; tam adı yazın'
      }
    },
    wordblock: {
      title: 'Kelimeblok',
      description: 'Aynı gün 5, 6 ve 7 harfli tabloların üçünde de birinci olan oyuncular.',
      anomaly: '5, 6 ve 7 harfte birinci'
    },
    ai: {
      title: 'AI Servisleri',
      roomCount: '{count} oda',
      emptyRooms: 'Henüz oda yok',
      queue: {
        title: 'Kuyruk ({count})',
        empty: 'Kuyrukta oda yok',
        steps: {
          waiting: 'Bekliyor',
          moderation: 'Modere ediliyor',
          tagging: 'Etiketleniyor'
        }
      },
      settings: {
        title: 'Ayarlar',
        description:
          "Public olan odaları AI ile denetler ve etiketi olmayan odalara 5 etiket üretir. API key'ler sadece yazılabilir: kayıtlı key geri gösterilmez, kalem ikonuyla yenisini girebilirsin.",
        provider: 'Sağlayıcı',
        model: 'Model',
        modelPlaceholder: 'örn. openai/gpt-oss-20b',
        apiKeys: "API key'ler",
        keyNotSet: 'Ayarlanmadı',
        newKey: "Yeni key'i yapıştır",
        features: 'Özellikler',
        tagGeneration: 'Etiket üretimi',
        tagGenerationHint: 'Public olan ve etiketi olmayan odalara 5 etiket ekler',
        roomModeration: 'Oda moderasyonu',
        roomModerationHint: 'Küfür, NSFW ve özel/kalitesiz içerikli odaları listeden kaldırır',
        tagPrompt: 'Etiket sistem promptu',
        moderationPrompt: 'Moderasyon sistem promptu'
      },
      taggedRooms: {
        title: 'Etiketlenenler',
        description: "AI'ın etiket eklediği odalar. Oda sahibi etiketleri sonradan değiştirebilir.",
        aiTags: 'AI etiketleri'
      },
      moderatedRooms: {
        title: 'Modere edilenler',
        description: "AI'ın public listeden kaldırdığı odalar ve moderasyon açıklamaları.",
        note: 'Moderasyon açıklaması'
      }
    },
    daily: {
      title: 'Günlük',
      description: 'Günlük modu 4 dakikadan uzun sürede 25 veya daha fazla doğruyla bitiren oyuncular.',
      anomaly: '{correct} doğru · {time} sürede bitirdi'
    }
  },
  socketStatus: {
    restarting: 'Sunucu güncelleniyor, birazdan yeniden bağlanacaksın...',
    reconnecting: 'Bağlantı koptu, yeniden bağlanılıyor...',
    idle: 'Uzun süre hareketsiz kaldığın için odadan çıkarıldın.',
    kicked: 'Oylama sonucu odadan atıldın.',
    gmKicked: 'GM tarafından odadan atıldın.',
    reconnect: 'Tekrar katıl'
  },
  chat: {
    chat: 'Sohbet',
    online: 'Online',
    system: 'Sistem',
    messagesEmpty: 'Henüz mesaj yok',
    messageField: {
      placeholder: 'Mesajını buraya yaz...'
    }
  },
  tourMode: {
    onlineUsers: 'Online oyuncular',
    player: 'Oyuncu',
    viewer: 'İzleyici',
    results: {
      title: 'Tur Sonuçları',
      correctAnswer: 'Doğru Cevap:',
      empty: {
        description: 'Cevabı kimse bilemedi'
      }
    },
    lastAnswers: {
      title: 'Son cevaplar',
      empty: {
        title: '',
        description: 'Henüz kimse cevap vermedi'
      }
    },
    guessingChance: {
      title: 'TAHMİN HAKKIN'
    },
    correctAnswer: {
      description: `<h2>✅ &nbsp; DOĞRU CEVAP!</h2> <p>Diğer oyuncuların cevaplarını bekle</p>`
    },
    wrongAnswer: {
      description: `YANLIŞ CEVAP`
    },
    playerFinishedTheTour: {
      description: `<h2>💔 &nbsp; TAHMİN HAKKIN BİTTİ!</h2> <p>Turun bitmesine kadar bekle</p>`
    }
  },
  wordblockMode: {
    wordblock: 'Kelimeblok',
    title: 'Kelimeblok - {charLength} harf',
    otherLengths: 'Diğer modları da oyna',
    letter: 'Harf'
  },
  musicMode: {
    title: 'Müzik quiz',
    subtitle: 'Şarkıları veya sanatçıları tahmin et',
    form: {
      searchArtist: {
        label: 'Sanatçı ya da Playlist ara',
        placeholder: 'Sanatçı veya playlist arayın... örn. Tarkan, 90lar pop',
        noResult: 'Sonuç bulunamadı',
        noOptions: 'Arama yapmak için yazmaya başlayın',
        searching: 'Aranıyor…',
        maxElements: 'Maksimum 3 sanatçı seçebilirsin'
      }
    },
    selectedArtists: {
      title: 'Seçilen sanatçılar',
      empty: 'Başlamak için sanatçı seç'
    },
    selectedPlaylist: {
      title: 'Seçilen çalma listesi'
    },
    play: 'Oyna',
    playHint: 'Sanatçı veya playlist arayın ve seçin',
    popularArtists: 'Öne Çıkan Sanatçılar',
    playlists: 'Öne Çıkan Çalma Listeleri',
    tagResults: {
      noMore: 'Hepsi bu kadar',
      empty: 'Sonuç bulunamadı'
    },
    groups: {
      artists: 'Sanatçılar',
      playlists: 'Çalma listeleri'
    },
    guessTheSong: {
      title: 'Müzik quiz',
      subtitle: 'Şarkıları dinle ve tahmin et',
      pickSong: 'Hangi şarkı çalıyor?',
      stats: {
        score: 'Skorum',
        selectedArtists: 'Seçilen sanatçılar',
        playlist: 'Çalma listesi',
        backToMusicMode: "Müzik quiz'e geri dön"
      }
    },
    nextRound: 'Sonraki tur',
    seeResults: 'Sonuçları gör',
    appleMusic: 'Apple Music'
  },
  period: {
    daily: {
      title: 'Günlük',
      slug: 'gun'
    },
    weekly: {
      short: 'Haftalık',
      slug: 'hafta'
    },
    monthly: {
      title: 'Aylık',
      slug: 'ay'
    },
    season: {
      title: '{seasonYear} Sezonu',
      slug: 'sezon'
    }
  },
  leaderboard: {
    title: 'Liderlik tablosu',
    modeTitle: '{mode} modu lider sıralaması',
    daily: {
      short: 'Günlük',
      full: 'Günlük lider sıralaması',
      scoredPoints: 'Bugün kazanılan puanlar',
      leaderSorting: 'Bugünün lider sıralaması'
    },
    weekly: {
      short: 'Haftalık',
      full: 'Haftalık lider sıralaması',
      scoredPoints: 'Bu hafta (Pazartesi-Pazar) kazanılan puanlar',
      leaderSorting: 'Bu haftanın (Pazartesi-Pazar) lider sıralaması'
    },
    monthly: {
      short: 'Aylık',
      full: 'Aylık lider sıralaması',
      scoredPoints: 'Bu ay ({startDate} - {endDate}) kazanılan puanlar',
      leaderSorting: 'Bu ayın ({startDate} - {endDate}) lider sıralaması'
    },
    season: {
      short: '{seasonYear} Sezonu',
      full: '{seasonYear} sezonu lider sıralaması',
      scoredPoints: 'Bu sezon kazanılan puanlar',
      leaderSorting: 'Bu sezonun lider sıralaması'
    },
    pending: 'Sıralama getiriliyor',
    // The row pinned above the list, showing the reader their own place on the board
    yourRank: {
      label: 'Sıralamadaki Yerin',
      short: 'Sen'
    },
    error: {
      fetch: {
        description: 'Sıralama getirilemedi',
        action: 'Tekrar dene'
      }
    },
    empty: {
      description: 'Henüz kimse sıralamaya girmedi'
    }
  },
  seo: {
    main: {
      title: 'parolla - Kelime oyunu',
      description: 'Günlük soruları çöz ve rekabete katıl. quiz oluştur, oyuncuların oluşturduğu quizleri çöz'
    },
    dailyMode: {
      title: 'Günlük kelime oyunu',
      description: 'parolla - Kelime oyunu - Günlük kelime oyunu, günlük bulmaca gibi!'
    },
    unlimitedMode: {
      title: 'Limitsiz',
      description: 'Sınırsız soru seti, bulmaca çöz, kelime oyunu oyna'
    },
    drawLobby: {
      title: 'Çiz',
      description:
        'Gerçek zamanlı çizim ve tahmin oyunu. Arkadaşlarınla resmi odalara katıl, kendi odanı kur ve kategorilerden seçtiğin kelimeleri çizip tahmin et.',
      keywords: 'çiz modu, çizim oyunu, kelime tahmin, multiplayer çizim, parolla çiz'
    },
    drawRoom: {
      title: 'Çiz Odası',
      description: 'Çiz modu odasına katıl, çiz ve tahmin et. Sırayla çizen oyuncular, kelime tahmin etme yarışı.',
      keywords: 'çiz odası, çizim oyna, kelime tahmin, parolla çiz oda'
    },
    creatorModeCompose: {
      title: 'Quiz oluştur',
      description: 'Quiz oluştur ya da oyuncuların oluşturduğu quizleri çöz',
      keywords: 'quiz oyunu, quiz çöz, quiz oluştur'
    },
    creatorModeComposeChoices: {
      title: 'Seçim quiz oluştur',
      description: 'Seçmeli quiz oluştur ya da oyuncuların oluşturduğu quizleri çöz',
      keywords: 'seçimli quiz, quiz çöz, quiz oluştur'
    },
    creatorModeComposeFlashcards: {
      title: 'Flashcards Quiz Oluştur',
      description: 'Çalışma ya da eğlence için flashcards quiz oluştur',
      keywords: 'flashcards, quiz, çalışma, öğrenme'
    },
    creatorModeQuizzes: {
      title: 'Quizler, quiz çöz ya da quiz oluştur',
      description: 'Oyuncuların oluşturduğu quizleri çöz ya da quiz oluştur',
      keywords: 'quiz oyunu, quiz çöz, quiz oluştur'
    },
    creatorModeQuiz: {
      title: '{quizTitle} quiz',
      description: '{quizTitle} quizini çöz!',
      keywords: 'quiz oyunu, quiz çöz, quiz oluştur'
    },
    tourMode: {
      title: 'Tur',
      description: 'Her tur bir soruyu cevapla, anlık rekabet'
    },
    wordblockMode: {
      title: 'Kelimeblok - {charLength} harf',
      description: '{charLength} harfli günün kelimesini 6 tahminde bul, günlük kelime oyunu',
      keywords: 'günlük kelime oyunu, wordle türkçe, wordle türkçe uyarlaması, kelime tahmi oyunu'
    },
    musicMode: {
      guessTheSong: {
        title: 'Şarkıları dinle ve tahmin et - Müzik quiz',
        description: "Müzik quiz'de şarkıları dinle ve tahmin et",
        keywords: 'müzik quiz, müzik quiz oyna, şarkıları dinle ve tahmin et'
      },
      guessTheSongPlay: {
        title: '{artists} şarkılarını dinle ve tahmin et - Müzik quiz',
        description: 'Müzik quizde {artists} şarkılarını dinle ve tahmin et',
        keywords: 'müzik quiz, müzik quiz oyna, şarkıları dinle ve tahmin et'
      }
    }
  },
  profile: {
    tabs: {
      quizzes: 'Quizler',
      reviews: 'Yorumlar',
      scores: 'Skorlar',
      achievements: 'Başarımlar'
    },
    stats: {
      created: 'Oluşturulan',
      played: 'Oynanan',
      reviews: 'Yorum'
    },
    scoresSubTabs: {
      creator: 'Yaratıcı',
      tour: 'Tur Modu'
    },
    actions: {
      goToProfile: 'Profil sayfasına git',
      report: 'Raporla'
    },
    editButton: 'Profili düzenle',
    notFound: {
      title: 'Bu kullanıcı bulunamadı',
      action: 'Ana sayfaya dön'
    },
    quizzesTab: {
      empty: 'Henüz quiz oluşturmamış.',
      error: 'Quizler yüklenemedi.'
    },
    reviewsTab: {
      empty: 'Henüz yorum yapmamış.',
      error: 'Yorumlar yüklenemedi.',
      replied: 'Yanıtın gönderildi'
    },
    scoresTab: {
      tour: { title: 'Tur modu skorları' },
      room: {
        title: 'Oynanan quiz skorları',
        empty: 'Henüz hiç quiz oynamamış.',
        error: 'Skorlar yüklenemedi.',
        statsLine: '{correct} doğru · {wrong} yanlış · {passed} pas'
      }
    }
  },
  account: {
    edit: { title: 'Profili düzenle' }
  },
  page: {
    legal: {
      updatedAt: 'Son güncelleme: {date}'
    }
  },
  playIntro: {
    play: 'OYUNA BAŞLA',
    share: 'Paylaş',
    rate: 'Puan Ver',
    howToPlay: 'Nasıl oynanır?',
    creator: 'Oluşturan',
    anon: 'Anonim',
    daily: 'GÜNLÜK',
    unlimited: 'LİMİTSİZ',
    rating: '{rating} /5',
    raters: '({count})',
    views: '{count} görüntülenme',
    questions: '{count} soru',
    choices: '{count} seçenek',
    flashcards: '{count} kart',
    comments: '{count} yorum',
    timeLimit: '{minutes} dk',
    letters: '{count} harf',
    leaderboard: 'Puan Tablosu',
    fullScoreboard: 'Tüm skor tablosu',
    dailyLeaderboard: 'Tüm Sıralamayı Gör',
    noScores: 'Henüz kimse oynamadı. İlk sen ol!'
  },
  common: {
    invalidUsername: 'Geçersiz kullanıcı adı',
    guestLabel: '(misafir)'
  }
}
