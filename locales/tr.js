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
    loginRequired: 'Giriş yapınız'
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
    refresh: 'Tazele'
  },
  auth: {
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
        subtitle: 'REKABETÇİ',
        description: 'Bugünün soru setini oyna, günlük kelime oyunu',
        todaysBestScoreLabel: 'Günün lideri',
        todaysBestScore: '{label} {player}',
        label: 'Bugün {count} kez oynandı'
      },
      unlimited: {
        title: 'LİMİTSİZ',
        description: 'Sonraki günü bekleme, rekabeti boşver',
        label: 'Limitsiz soru seti'
      },
      creator: {
        title: 'YARATICI',
        description: 'Quiz oluştur, oyuncuların oluşturduğu quizleri çöz',
        label: 'Bugün {count} quiz çözüldü',
        todaysQuizLabel: 'Günün quizi'
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
        label: 'Bugün {count} kez oynandı'
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
    menu: {
      profileEdit: 'Profili düzenle',
      profileView: 'Profili görüntüle',
      title: 'Daha fazla',
      usernameEdit: 'Oyuncu adını değiştir',
      menu: 'Menü',
      darkTheme: 'Koyu tema',
      soundFx: 'Ses efekleri',
      switchLocale: 'Dil değiştir',
      suggestQa: 'Soru önermek ister misin?',
      howToPLay: 'Nasıl oynanır?',
      howToCalculateStats: 'Skoru nasıl hesaplıyoruz',
      shareRoom: `Quiz'i paylaş`,
      reviewRoom: `Quiz'i değerlendir`,
      shareApp: `parolla'yı paylaş`,
      credits: 'Yapımcılar',
      contact: 'Bize ulaşın'
    },
    howToCalculateStats: {
      title: 'Skoru nasıl hesaplıyoruz',
      description:
        'Cevabın doğru ise doğru sorulara yanlış ise yanlış sorulara eklenir. <br><br> Eğer süren bittiğinde hala paslanmış soruların varsa bunlar da pasladığın sorulara eklenir. <br><br> Ve tüm toplam sonuç oyun bittiğinde istatistik ekranında gösterilir.'
    },
    credits: {
      title: 'Yapımcılar',
      description:
        'parolla açık kaynak bir projedir. <a href="https://github.com/selimdoyranli/parolla" rel="nofollow,noopener" target="_blank">GitHub</a> bağlantısından ulaşabilirsin. Yapımcılar: <label><a href="https://twitter.com/selimdoyranli" target="_blank">@selimdoyranli</a></label> <label><a href="https://twitter.com/apo_bozdag" target="_blank">@apo_bozdag</a></label> <label><a href="https://twitter.com/muratozakcill" target="_blank">@muratozakcill</a></label>'
    },
    contact: {
      title: 'Bize ulaşın',
      description:
        'Öneri, şikayet ya da işbirliği için; <br><br> <a href="mailto:parollaapp@gmail.com?subject=parolla_contact">parollaapp@gmail.com</a> <br> veya <br> <a href="https://twitter.com/parollaapp" target="_blank">@parollaapp</a> <br> twitter hesabımızdan ulaşabilirsin.'
    },
    announcements: {
      title: 'Duyurular',
      description: 'Duyurular'
    },
    createdRoom: {
      title: 'Quiz oluşturuldu',
      joinRoom: 'Quize git',
      isListedMessage: `Quizin {isListed}. <br> <br> Yanlış seçenekle yayınladıysan bu pencereyi kapattıktan sonra düzenleyip tekrar gönderebilirsin.`,
      public: '<strong>QUIZ LİSTESİNDE GÖRÜNECEK</strong> şekilde oluşturuldu',
      private:
        '<strong>QUIZ LİSTESİNDE GÖRÜNMEYECEK</strong> şekilde oluşturuldu, ama quiz bağlantını bilen arkadaşların hala quizine girebilir',
      copyUrl: {
        callback: {
          success: 'Quiz bağlantısı kopyalandı'
        }
      }
    },
    howToPlay: {
      title: 'parolla nasıl oynanır?',
      description: `
        Her karaktere karşılık gelen sorunun cevabını bulmalısın, cevap o karakter ile başlar.<br><br>
        Örneğin: <strong>Bal yapan hayvan?</strong> sorusunda aktif karakter <strong>A</strong> ve bunun cevabı <strong>Arı</strong>'dır gibi.<br><br>
        Cevabın <strong>🟩 Doğru</strong> ya da <strong>🟥 Yanlış</strong> olabilir. <br> Eğer cevabı bilmiyorsan <strong>🟨 PAS</strong>
        butonuna bas ya da pas yazıp gönder. Daha sonra o soruya dönebileceksin. Pasladığın soruları süren bitene kadar cevaplayabilirsin.
        <br><br> Oyunun toplam süresi <strong>5 dakika</strong>'dır.
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
        extra:
          'Bu quiz başka bir oyuncu tarafından hazırlandı <br> {questionCount} soru ve {questionCount} cevap var. Bu modu tekrar tekrar oynayabilirsin.'
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
        title: 'parolla kelimeblok nasıl oynanır?'
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
        description: 'Oyun bittiğinde <br> istatistik burada görünecek.'
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
      title: 'Quiz değerlendirmeleri',
      review: 'Değerlendir',
      loginToReview: 'Değerlendirmek için <u>giriş yapın</u>',
      pendingReviews: 'Yorumlar getiriliyor',
      error: {
        fetchReviews: {
          description: 'Yorumlar getirilemedi',
          action: 'Tekrar dene'
        }
      }
    },
    tourModeOnline: {
      title: 'Tur'
    },
    auth: {
      title: 'Giriş yap',
      login: 'Giriş yap',
      register: 'Kayıt ol',
      loginWithGoogle: 'Google ile Giriş Yap'
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
      description: `parolla - Kelime oyunu\n\n\Günlük soruları çöz ve rekabete katıl. Quiz oluştur, oyuncuların oluşturduğu quizleri çöz \n\nhttps://parolla.app`
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
      description: `parolla - Kelime oyunu \n\nKelimeblok modunda skorum\n\n{attempts}/{maxAttempts}\n\n{cells}\n\nGeçen Süre: {elapsedTime} \n \n{url}`
    }
  },
  creatorModeIntro: {
    description:
      '<strong>Oyuncular tarafından oluşturulmuş quizler</strong> &nbsp; <br> Hemen <strong>quizlere bak</strong> ya da <strong>quiz oluştur</strong>',
    list: {
      rooms: {
        title: 'QUIZLERE BAK'
      },
      compose: {
        title: 'QUIZ OLUŞTUR'
      },
      myRooms: {
        title: 'SON OLUŞTURDUĞUM QUIZLER'
      }
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
      callback: {
        success: 'Quiz silindi'
      }
    }
  },
  form: {
    isRequired: '{model} gereklidir',
    isInvalid: '{model} geçersiz',
    creatorModeCompose: {
      title: 'QUIZ OLUŞTUR',
      clearForm: 'Formu Temizle',
      roomInformations: 'QUIZ BİLGİLERİ',
      qaSet: 'SORU-CEVAP SETİ',
      room: {
        roomTitle: {
          label: 'Quiz başlığı',
          placeholder: 'Quiz başlığı yaz'
        },
        isListed: {
          label: 'Quizler listesinde görünsün mü?'
        },
        isAnon: {
          label: 'Adın gizlensin mi?'
        },
        tag: {
          label: 'Etiketler',
          placeholder: 'Etiket yaz'
        }
      },
      qa: {
        empty: {
          description: 'Quizin şu anda boş',
          action: 'Soru ekle'
        },
        question: {
          label: 'Soru',
          placeholder: 'Soruyu yaz'
        },
        answer: {
          label: 'Cevap',
          placeholder: 'Cevapları virgül ile ayırabilirsin',
          error: {
            nonMatched: 'Her cevap aynı karakterle başlamalı'
          }
        },
        character: {
          label: 'Karakter',
          placeholder: 'Soru karakteri'
        },
        addMoreQuestion: 'Başka soru ekle'
      },
      saveDraft: {
        action: 'Taslak kaydet',
        callback: {
          success: 'Sonrası için kaydediliyor, geri döndüğünde aynı form olacak'
        }
      },
      deleteDraft: {
        action: 'Kayıtlı formu temizle',
        confirm: {
          title: 'Emin misin?',
          description: 'Formu temizliyorsun şu anda formda gördüklerin silinecek',
          confirm: 'Temizle',
          cancel: 'Vazgeç'
        },
        callback: {
          success: 'Kayıtlı form temizlendi'
        }
      },
      termsDescription:
        '* Quiz oluştururken spam, nefret söylemi içeren, ırkçı ve aşağılayacı içeriklerden kaçının. Bu gibi quizler moderasyon tespitinde silinecektir. Quiz oluştururken IP adresiniz yasal mevzuat gereği saklanır. İhlal durumunda yasal yaptırım uygulanabilir.',
      submit: 'Bitir ve yayınla',
      error: {
        couldNotCreate: 'Quiz oluşturulamadı, lütfen kontrol edip tekrar dene'
      }
    },
    creatorModeEdit: {
      title: 'QUIZ DÜZENLE',
      submit: 'Güncelle ve yayınla'
    },
    roomReview: {
      back: 'Geri dön',
      comment: {
        placeholder: 'Yorumunu yaz'
      },
      submit: 'Gönder',
      empty: {
        rating: {
          description: 'Yorum yazmadan önce puan vermelisin'
        }
      },
      error: {
        emptyRating: 'Puan vermelisin',
        required: 'Bir şeyler yazmalısın',
        maxLength: 'Çok uzun yazmamalısın'
      }
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
      }
    }
  },
  roomReviewList: {
    ratingTitle: 'Quiz puanı',
    reviewsTitle: 'Yorumlar',
    empty: {
      description: 'Henüz kimse değerlendirme yapmadı',
      action: 'Yorum ekle'
    }
  },
  scoreboard: {
    scoreboard: 'Skor tablosu',
    pendingScoreboard: 'Skorlar getiriliyor',
    loginToBeInScoreboard: '<u>Giriş yaptıktan</u> sonra oynarsan quize ait skor tablosunda yer alırsın',
    loginToBeInScoreboardExtra: 'Giriş yapmadan oynarsan skorunu sadece sen görebilirsin'
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
    creatorModeCompose: {
      title: 'Quiz oluştur',
      description: 'Quiz oluştur ya da oyuncuların oluşturduğu quizleri çöz',
      keywords: 'quiz oyunu, quiz çöz, quiz oluştur'
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
      title: 'Kelimeblok',
      description: 'Günün kelimesini tahmin et, günlük kelime oyunu',
      keywords: 'günlük kelime oyunu, wordle türkçe, wordle türkçe uyarlaması, kelime tahmi oyunu'
    }
  }
}
