export default {
  app: {
    name: 'parolla',
    domain: 'parolla.app',
    description: 'Solve daily questions and join the competition. Create your own quiz and solve quizzes created by players',
    publisher: 'Selim Doyranlı',
    copyright: '{text} {spacer} {logo}'
  },
  error: {
    error: 'Error',
    anErrorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    goToHome: 'Go to home',
    unAuthorized: 'Unauthorized access',
    loginRequired: 'Login required',
    mediaError: {
      uploadFailed: 'Media upload failed',
      limitExceeded: 'Media size limit exceeded',
      mimeTypeNotAllowed: 'Media mime type not allowed',
      extensionNotAllowed: 'Media extension not allowed'
    },
    tooManyLines: 'Maximum {max} lines allowed',
    textTooLong: 'Some lines are longer than 64 characters',
    tooManyFiles: 'Maximum {max} files allowed',
    invalidYoutubeLinks: 'Some links are invalid, please check',
    choicesLength: 'You must add at least {min} and at most {max} choices',
    flashcardListLength: 'Flashcard list must have at least {min} and at most {max} cards',
    rateLimited: 'You are going too fast.\n Please try again in {seconds} seconds.'
  },
  economy: {
    retry: 'Retry',
    earned: {
      incomplete: 'Finish every letter or let the timer run out to earn rewards.',
      capped: 'You hit the daily cap',
      questDone: 'Quest completed: {title}',
      viewQuests: 'Quests',
      guestTeaser: 'You would have earned {amount} if you had logged in',
      login: 'Log in'
    },
    inventory: {
      title: 'Inventory',
      tabs: { inventory: 'Inventory', shop: 'Shop', quests: 'Quests' }
    },
    quests: {
      loginPrompt: 'Log in to see your quests.',
      title: 'Quests',
      daily: 'Daily quests',
      weekly: 'Weekly quests',
      claim: 'Claim',
      reroll: 'Reroll',
      chestTitle: 'Weekly gold gift',
      chestHint: 'Claim every weekly quest',
      claimed: 'You earned +{amount} gold',
      rerolled: 'Quest rerolled',
      chestClaimed: '+{amount} gold from the chest'
    },
    errors: {
      'free-event': 'This set is free during the event, equip it without buying',
      'insufficient-gold': 'Not enough gold',
      'already-claimed': 'Already claimed',
      'reroll-used': "You already used today's reroll",
      'limit-reached': 'Limit reached',
      'already-owned': 'You already own this item',
      'not-for-sale': 'This item is not for sale',
      'vitrin-expired': 'This showcase deal has expired',
      'nothing-to-buy': 'Nothing left to buy in this set',
      'not-completed': 'This quest is not completed yet',
      'key-reused': 'This request was already used, try again',
      'loadout-too-fast': 'You are changing too fast, wait a moment',
      'bad-key': 'Invalid request',
      'not-assigned': 'This quest is not assigned to you',
      'no-replacement': 'No replacement quest available',
      completed: 'This quest is already completed',
      'not-ready': 'Not ready yet',
      'unknown-item': 'Item not found',
      'invalid-slot': 'Invalid loadout slot',
      generic: 'Something went wrong, try again'
    },
    achievements: {
      title: 'Achievements',
      goal: {
        'alfabe-ustasi': 'Finish the daily mode {n} times',
        kusursuz: 'Finish the daily mode {n} times with no wrong or passed answers',
        'kelime-avcisi': 'Solve {n} Wordblocks',
        'keskin-goz': 'Solve {n} Wordblocks in 2 tries or fewer',
        'tek-atis': 'Solve {n} Wordblocks on the first try',
        turcu: 'Earn {n} tour points in total',
        mimar: '{n} different players play your quizzes',
        'quiz-yaraticisi': 'Create {n} public quizzes',
        sadik: 'Reach a {n}-day login streak',
        koleksiyoncu: 'Own {n} cosmetics',
        'profil-fotografi': 'Add a profile photo',
        firstLegendary: 'Get your first legendary cosmetic'
      },
      note: {
        'profil-fotografi': 'Just use an uploaded photo instead of the avatar.',
        'quiz-yaraticisi': 'Your quiz counts if it follows the rules; it is checked automatically within 1 hour.'
      }
    },
    dailyReward: 'Daily reward: +{amount} gold (streak {streak})',
    collection: {
      freeTitle: 'Free during the event',
      freeUntil: 'Until {date}',
      title: 'Inventory',
      preview: 'Preview',
      equip: 'Equip',
      unequip: 'Remove',
      equipped: 'Equipped',
      unequipped: 'Removed',
      previewOpen: 'Preview',
      empty: "You don't own any items yet.",
      goShop: 'Go to the shop',
      loginPrompt: 'Log in to see your inventory.',
      login: 'Log in'
    },
    history: {
      title: 'Gold history',
      balance: 'Balance',
      more: 'Load more',
      empty: 'No gold activity yet.',
      loginPrompt: 'Log in to see your gold history.',
      reasons: {
        signup: 'Welcome bonus',
        early: 'Early user bonus',
        daily_login: 'Daily login',
        play_daily: 'Daily quiz',
        play_wordblock: 'Wordblock',
        play_tour: 'Tournament',
        play_room: 'Room',
        creator: 'Room creator reward',
        daily_top: "Day's top players",
        quest: 'Quest',
        quest_chest: 'Weekly chest',
        achievement: 'Achievement',
        purchase: 'Purchase',
        set_purchase: 'Set purchase',
        reroll: 'Quest reroll',
        streak_freeze: 'Login streak freeze',
        season: 'Season reward',
        admin: 'Admin adjustment'
      }
    },
    shop: {
      freeChip: 'Free · Event',
      freeSet: 'Free during the event',
      title: 'Shop',
      vitrin: "Today's showcase",
      products: 'Products',
      login: 'Log in',
      equippedLabel: 'Equipped',
      buySet: 'Buy set',
      owned: 'Owned',
      original: 'Original',
      price: 'Price',
      balance: 'Your balance',
      balanceAfter: 'After purchase',
      confirm: 'Confirm',
      equip: 'Equip',
      equipped: 'Equipped',
      equipFailed: 'Purchased, but equipping failed. Try again.',
      purchased: 'Purchased',
      setContent: 'Buys all {count} items in the set you do not own yet.',
      insufficient: 'Not enough gold. Balance: {balance}, missing: {missing}',
      rarity: { siradan: 'Common', nadir: 'Rare', epik: 'Epic', efsanevi: 'Legendary', sezon: 'Season' },
      categories: {
        all: 'All',
        avatar_frame: 'Avatar frame',
        avatar_decoration: 'Avatar decoration',
        profile_effect: 'Profile effect',
        profile_frame: 'Profile frame',
        profile_cover: 'Profile cover',
        name_color: 'Name color',
        sets: 'Sets'
      },
      freeze: {
        title: 'Login streak freeze',
        desc: 'Keeps your login streak if you miss a day.',
        note: 'If you miss a day, your login streak is kept. You can hold up to {max}.',
        full: 'Full'
      }
    }
  },
  success: {
    success: 'Success'
  },
  general: {
    loading: 'Loading',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    cancel: 'Cancel',
    clear: 'Clear',
    backToTop: 'Back to top',
    save: 'Save',
    apply: 'Apply',
    question: 'Question',
    answer: 'Answer',
    option: 'Option',
    remove: 'Remove',
    delete: 'Delete',
    edit: 'Edit',
    open: 'Open',
    close: 'Close',
    playAgain: 'Play again',
    stats: 'Stats',
    dailyStats: `Today's stats`,
    share: 'Share',
    by: 'By',
    comments: 'Comments',
    noData: 'No data',
    filter: 'Filter',
    sort: 'Sort',
    ad: 'Ad',
    send: 'Send',
    playNow: 'Play now',
    play: 'Play',
    joined: 'Joined',
    anon: 'anonym',
    refresh: 'Refresh',
    draft: 'Draft',
    quiz: 'Quiz',
    photoQuiz: 'Photo quiz',
    triviaQuiz: 'Trivia',
    thisOrThatQuiz: 'This or that?',
    flashcardsQuiz: 'Flashcards',
    provider: 'Provider',
    quizPreparing: 'Preparing quiz',
    loadMore: 'Load more'
  },
  auth: {
    accountBlocked: 'Your account has been closed by the system',
    google: {
      callback: {
        redirecting: 'Redirecting, please wait...',
        ifNoRedirect: 'If you stuck on this page, click <a href="/" title="word game">here</a> to go to the home page'
      }
    },
    error: {
      title: 'Login failed, try again'
    },
    dialog: {
      list: {
        title: 'By logging in',
        item1: {
          title: 'Create a quiz'
        },
        item2: {
          title: 'Review quizzes'
        },
        item3: {
          title: 'Be in the scoreboard'
        },
        item4: {
          title: 'Play the tour mode'
        },
        item5: {
          title: 'Join the chat'
        }
      }
    }
  },
  introScene: {
    title: 'Word game',
    subtitle: 'Daily word game',
    description: 'Solve daily questions and join the competition. Create your own quiz and solve quizzes created by players',
    modeList: {
      daily: {
        title: 'DAILY',
        heading: 'DAILY WORD GAME',
        description: `Play today's question set and join the competition, or just test your knowledge`,
        playDaily: 'Play Daily',
        playUnlimited: 'Play Unlimited'
      },
      unlimited: {
        title: 'UNLIMITED'
      },
      creator: {
        title: 'CREATOR',
        description: 'Create your own quiz and solve quizzes created by players',
        label: 'Today {count} quiz solved',
        todaysQuizLabel: `Today's quiz`,
        playButtonText: 'All Quizzes: Play'
      },
      tour: {
        title: 'TOUR',
        description: 'Answer the question in each round, instant competition',
        liveCount: `{count} active player`,
        label: 'LIVE',
        todaysBestScoreByLabel: 'by',
        todaysBestScoreLabel: "Today's best score",
        todaysBestScore: `{label} {by} {byLabel} {score} points`
      },
      wordblock: {
        title: 'WORDBLOCK',
        description: `Guess the today's word, daily word game`,
        label: 'Played {count} times today',
        todaysBestScoreLabel: `Today's leader`,
        todaysBestScore: '{label} {player}'
      },
      music: {
        title: 'MUSIC',
        description: 'Listen to songs and guess them',
        label: 'Songs of the artist you want'
      },
      draw: {
        title: 'DRAW',
        description: 'Draw, guess, win — live drawing game',
        label: 'LIVE',
        newLabel: 'New'
      },
      geoGuess: {
        title: 'GEOGUESS',
        description: 'Guess where the street photo was taken',
        label: 'Anywhere in the world'
      }
    }
  },
  gameScene: {
    pendingQuestions: 'Fetching questions',
    answerField: {
      placeholder: 'Type answer',
      submit: 'SEND',
      pass: 'PASS'
    },
    correct: 'Correct',
    wrong: 'Incorrect',
    pass: 'Pass',
    remainTime: 'Remain time',
    elapsedTime: 'Elapsed time',
    scoreStats: 'Score chart',
    answerKey: 'Answer key',
    correctAnswer: 'Correct answer',
    yourAnswer: 'Your answer',
    gamerAnswer: `Gamer's answer`,
    halfTime: 'Half of the time is up',
    timeOver: 'Time is over',
    allQuestionsSeen: `If you can't think of an answer, you don't have to wait for the time, you can also type finish and finish it.`,
    unsupportedHeight: 'You should play on a bigger screen for a better experience',
    toast: {
      startGame: {
        title: `It's good to know`,
        description: '<ul> <li>If you want to end the game early, you can write <code>finish</code> and send it.</li> </ul>'
      }
    },
    skipAdShowScore: 'Skip the ad and see your score ⇥',
    error: {
      fetchQuestions: {
        description: 'Trouble fetching questions',
        action: 'Try again'
      },
      notStartsWithActiveChar: 'ANSWER MUST START WITH THE CHARACTER ({activeChar}) ABOVE'
    }
  },
  dialog: {
    addChoices: {
      title: 'Add choice',
      tab: {
        photo: 'Photo',
        youtube: 'YouTube',
        text: 'Text'
      },
      placeholder: {
        youtube: 'Paste YouTube links...',
        text: 'Paste texts...'
      },
      selectSystemFiles: 'Select files',
      selectedCount: '{count} photos selected',
      useFilenameAsMediaNote: 'Use filename as description'
    },
    menu: {
      title: 'More',
      activities: 'Activities',
      usernameEdit: 'Change the player name',
      menu: 'Menu',
      home: 'Home',
      shop: 'Shop',
      quizzes: 'Quizzes',
      profileEdit: 'Edit profile',
      profileView: 'View profile',
      myQuizzes: 'My quizzes',
      communities: 'Communities',
      darkTheme: 'Dark theme',
      soundFx: 'Sound Effects',
      reactionSoundFx: 'Reaction sounds',
      reactionSoundFxDesc: 'For reaction sounds like click, keyboard and popup',
      gameSceneSoundFx: 'Game scene sounds',
      gameSceneSoundFxDesc: 'For scene sounds like correct, wrong, pass and time',
      wordblockKeyboard: 'Wordblock Keyboard',
      switchLocale: 'Choose language',
      suggestQa: 'Do you want to suggest a question?',
      howToPLay: 'How to play?',
      howToCalculateStats: 'How we calculate the score',
      shareRoom: 'Share quiz',
      reviewRoom: 'Review quiz',
      shareApp: `Share the parolla`,
      credits: 'Credits',
      contact: 'Contact',
      legal: 'Legal',
      privacyPolicy: 'Privacy Policy',
      cookiePolicy: 'Cookie Policy',
      kvkk: 'KVKK Clarification Text',
      termsOfUse: 'Terms of Use'
    },
    howToCalculateStats: {
      title: 'How we calculate the score',
      description:
        'If your answer is correct, it is added to the correct questions, if incorrect, to the incorrect questions. <br><br> If you still have rusted questions when your time is up, these will be added to the questions you have passed. <br><br> And all the total results are shown on the statistics screen when the game is over.'
    },
    credits: {
      title: 'Credits',
      description: '<a href="https://kozmos.works" rel="noopener" target="_blank">KOZMOS (kozmos.works)</a>'
    },
    contact: {
      title: 'Contact',
      description:
        'For suggestions, complaint, collaborations; <br><br> <a href="mailto:parollaapp@gmail.com?subject=parolla_contact">parollaapp@gmail.com</a> <br> or <br> <a href="https://twitter.com/parollaapp" target="_blank">@parollaapp</a> <br> You can reach us on our twitter account.'
    },
    report: {
      title: 'Report',
      scope: {
        label: 'Scope',
        placeholder: 'Report scope'
      },
      detail: {
        label: 'Detail',
        placeholder: 'Describe your complaint'
      },
      media: {
        label: 'Images (optional)',
        hint: 'images',
        uploading: 'Uploading'
      },
      reportedUser: {
        label: 'Reported player'
      },
      reportedMessage: {
        label: 'Reported message'
      },
      additional: {
        label: 'Additional info'
      },
      submit: 'Submit',
      callback: {
        success: 'Your report has been submitted successfully',
        error: 'Failed to submit report'
      }
    },
    createQuizSelection: {
      title: 'Create quiz',
      quizType: {
        qa: {
          title: 'Question-Answer (Classic)',
          description: 'Players answer the questions you add',
          label: 'Classic question-answer quiz against time',
          createQaQuiz: 'Create question-answer quiz'
        },
        thisOrThat: {
          title: 'This or That?',
          description: 'Create a list of choices, players choose one of two options each round',
          label: 'No competition, determines personal preferences',
          createThisOrThatQuiz: 'Create this or that quiz'
        },
        flashcards: {
          title: 'Flashcards',
          description: 'Create a set of cards with front and back text for studying or having fun',
          label: 'Study or have fun',
          createFlashcardsQuiz: 'Create flashcards quiz'
        }
      }
    },
    createdRoom: {
      title: 'Quiz created',
      quizUpdated: 'Quiz updated',
      joinRoom: 'Join quiz',
      isListedMessage: `Your quiz {isListed} has been created.`,
      public: '<strong>WILL APPEAR IN QUIZ LIST</strong>',
      private: '<strong>PRIVATE</strong>',
      copyUrl: {
        callback: {
          success: 'Copied quiz URL'
        }
      }
    },
    mediaUpload: {
      title: 'Upload media',
      uploadArea: {
        addMultiplePhoto: 'Add multiple photo',
        description: 'Select file from your device or drag and drop'
      },
      selectFile: 'Select file',
      selectPhotoOrVideo: 'Select photo or video',
      tabs: {
        file: 'File',
        youtube: 'YouTube'
      },
      youtubeUrl: {
        label: 'URL',
        placeholder: 'https://www.youtube.com/watch?v=...',
        error: 'Enter a valid YouTube URL'
      }
    },
    howToPlay: {
      title: 'How to play parolla?',
      description: `
      You have to find the answer to the question corresponding to each character, the answer starts with that character.<br><br>
        For example: <strong>The fruit that fell on Newton's head?</strong> active character in question <strong>A</strong> and the answer is <strong>Apple</strong>.<br><br>
        Your answer may be <strong>🟩 Correct</strong> or <strong>🟥 Incorrect</strong>. <br> If you don't know the answer press the <strong>🟨 PASS</strong>
        button or type pass and send it. You can come back to that question later. You can answer the questions you pass until your time runs out.
        <br><br> The total duration of the game is <strong>{gameTimeLimitMinutes} minutes</strong>.
        <br><small>If you refresh the page the game starts from the beginning</small>`,
      body: `
        {description}
        {extra}
        `,
      daily: {
        extra:
          '<strong>parolla</strong> game contains <strong>{questionCount}</strong> English alphabet letters. New questions come every day.'
      },
      unlimited: {
        extra:
          '<strong>parolla</strong> game contains <strong>{questionCount}</strong> English alphabet letters. <br> You can play this mod over and over again. Different questions come up every time.'
      },
      creator: {
        thisOrThat: {
          title: 'How to play this or that quiz?',
          description: 'Choose between two options each round',
          extra: 'There are {choiceCount} choices. You can play this mod over and over again.'
        },
        flashcards: {
          title: 'Flashcards',
          description: 'This quiz has <strong>{cardCount} flashcards</strong>.',
          extra: 'Tap a card to flip it. Use arrows to navigate between cards.'
        },
        description: `
        You have to find the answer to the question corresponding to each character, the answer starts with that character.
        <br><br> The total duration of the game is <strong>{gameTimeLimitMinutes} minutes</strong>.
        <br><small>If you refresh the page the game starts from the beginning</small>`,
        descriptionTrivia: `
        You have to find the correct answer to each question.
        <br><br> The total duration of the game is <strong>{gameTimeLimitMinutes} minutes</strong>.
        <br><small>If you refresh the page the game starts from the beginning</small>`,
        preparedBy: 'Prepared by',
        extra: 'There are {questionCount} questions and {questionCount} answers. You can play this mod over and over again.'
      },
      tour: {
        extra: `You have to find the answer to the question corresponding to each character, the answer starts with that character.<br><br>
        For example: <strong>The fruit that fell on Newton's head?</strong> active character in question <strong>A</strong> and the answer is <strong>Apple</strong>.<br><br>
        <strong>Parolla</strong> tour mode is a game mode where multiple players see the same question in each round and try to give the same correct answer. The question changes each round and players collect points by trying to give the correct answer in each round.<br><br>
        Each round is <strong>30</strong> seconds and you have <strong>3</strong> chances to give the correct answer each round.`
      },
      cancelButtonText: 'Close and Play',
      wordblock: {
        title: 'How to play parolla wordblock?',
        heading: `Find Today's Word`,
        guessRule: 'Each guess must be a valid {charLength} letter word. Hit enter to submit.',
        attemptsRule: 'After each guess, the tile colors change to show how close your guess was. You have {maxAttempts} attempts.',
        examplesLabel: 'Examples',
        example: {
          correct: 'is in the word and in the right spot.',
          present: 'is in the word but in the wrong spot.',
          absent: 'is not in the word.'
        },
        footer: 'A new word arrives every day!'
      }
    },
    stats: {
      clipboard: {
        score: {
          callback: {
            success: 'Copied your score'
          }
        }
      },
      empty: {
        description: 'When the game is over, <br> the statistics will be displayed here',
        answerKey: 'When the game is over, <br> the answer key will be displayed here'
      },
      daily: {
        nextGame: 'Next game'
      },
      won: {
        title: 'Congratulations!',
        description: '{attempts}. guess <strong>{targetWord}</strong> word.',
        attempts: {
          one: 'One shot!',
          two: 'Excellent!',
          three: 'Super!',
          four: 'Nice!',
          five: 'Not bad!'
        }
      },
      lost: {
        title: 'Game over!',
        description: 'Unfortunately, you did not guess the <strong>{targetWord}</strong> word.'
      }
    },
    interstitialAd: {
      title: 'We keep it up with ad support'
    },
    localeSwitch: {
      title: 'Choose language',
      switching: 'Switching'
    },
    leave: {
      title: 'Do you confirm?',
      description: 'You may have to do the things you did again'
    },
    roomReview: {
      title: 'Quiz reviews'
    },
    playerActions: {
      title: 'More ({username})',
      showProfile: 'Show Profile',
      report: 'Report',
      voteKick: 'Vote to kick from room'
    },
    tourModeOnline: {
      title: 'Tour'
    },
    auth: {
      title: 'Login',
      login: 'Login',
      register: 'Register',
      loginOrRegister: 'Log in / Sign up',
      loginWithGoogle: 'Continue with Google',
      loginWithApple: 'Continue with Apple'
    },
    player: {
      title: 'Profile',
      myBio: 'About',
      tourScore: {
        title: 'Tour mode scores',
        loading: 'Fetching tour scores',
        callback: {
          error: {
            title: 'Tour scores could not be fetched',
            action: 'Try again'
          }
        }
      },
      loading: 'Fetching player information',
      callback: {
        error: {
          title: 'Player information could not be fetched',
          action: 'Try again'
        }
      }
    },
    avatarEditor: {
      title: 'Edit avatar',
      livePreview: 'Live Preview',
      mouth: 'Mouth',
      eyes: 'Eyes',
      eyebrows: 'Eyebrows',
      hair: 'Hair Style',
      hairColor: 'Hair Color',
      earrings: 'Earrings',
      features: 'Features',
      glasses: 'Glasses',
      featureOptions: {
        none: 'None',
        birthmark: 'Birthmark',
        blush: 'Blush',
        freckles: 'Freckles',
        mustache: 'Mustache'
      },
      skinColor: 'Skin Color',
      backgroundColor: 'Background Color'
    },
    profilePhotoEditor: {
      title: 'Profile Photo',
      selectFile: 'Select File',
      change: 'Change',
      hint: 'JPG, PNG, GIF or WEBP — up to 5 MB',
      error: {
        mimeTypeNotAllowed: 'This file type is not supported',
        sizeLimitExceeded: 'File exceeds the 5 MB limit',
        cropFailed: 'Could not process the photo'
      }
    },
    deleteProfilePhoto: {
      title: 'Delete profile photo',
      message: 'Your uploaded profile photo will be permanently removed. Continue?'
    },
    guestDrawer: {
      title: 'Guest Profile',
      regenerateAvatar: 'Regenerate Avatar',
      regenerateName: 'Random',
      confirm: 'Confirm',
      usernameLabel: 'Username'
    },
    drawRoomClosed: {
      hostLeftTitle: 'Host left the room',
      hostLeftHint: 'The room is closed. You can return to the lobby.',
      emptyTitle: 'Room closed',
      emptyHint: 'No one is left in the room.',
      backToLobby: 'Back to Lobby'
    },
    enterPassword: {
      title: 'Protected Room',
      hint: 'Enter the password to join this room.',
      placeholder: 'Room password',
      confirm: 'Join',
      cancel: 'Cancel',
      wrongPassword: 'Wrong password. Try again.'
    }
  },
  clipboard: {
    copy: 'Copy',
    callback: {
      success: 'Copied to clipboard',
      error: 'There was a problem and it was not copied'
    }
  },
  sharer: {
    app: {
      description: `parolla - Word game\n\n\Solve daily questions and join the competition. Create your own quiz and solve quizzes created by players \n\nhttps://www.parolla.app`
    },
    room: {
      description: `parolla - Word game \n\nPlay the "{quizTitle}" quiz! \n \n{url}`
    },
    dailyModeStats: {
      description: `parolla - Word game \n\n{day} \n\n🟩 {correctAnswerCount} Correct \n🟥 {wrongAnswerCount} Incorrect \n🟨 {passedAnswerCount} Pass \n \nRemain time: {remainTime} \n \n{url}`
    },
    unlimitedModeStats: {
      description: `parolla - Word game \n\n(Unlimited game mode) \n\n🟩 {correctAnswerCount} Correct \n🟥 {wrongAnswerCount} Incorrect \n🟨 {passedAnswerCount} Pass \n \nRemain time: {remainTime} \n \n{url}`
    },
    creatorModeStats: {
      description: `parolla - Word game \n\nI played the "{quizTitle}" quiz \n\n🟩 {correctAnswerCount} Correct \n🟥 {wrongAnswerCount} Incorrect \n🟨 {passedAnswerCount} Pass \n \nRemain time: {remainTime} \n \n{url}`
    },
    wordblockModeStats: {
      description: `parolla - Word game \n\nMy score in word block mode ({charLength} letters)\n\n{attempts}. attempts / {maxAttempts} guesses\n\n{cells}\n\nTime elapsed: {elapsedTime} \n \n{url}`
    },
    guessTheSongStats: {
      description: `parolla - Music quiz - I guessed the songs of {artists} \n \nScore: {score} \n \n{url}`
    },
    geoGuessStats: {
      description: `parolla - GeoGuess ({region}) 🌍 \n \nScore: {score} \n \n{url}`
    }
  },
  creatorModeRooms: {
    title: 'QUIZZES',
    joinRoom: {
      typeUrl: 'TYPE QUIZ URL',
      url: {
        action: 'JOIN QUIZ'
      }
    },
    divider: 'OR',
    rooms: {
      pendingRooms: 'Fetching quizzes',
      selectFromList: 'SELECT FROM LIST',
      filters: {
        title: 'FILTERS',
        recently: 'Recent quizzes',
        oldest: 'Old quizzes',
        byViewCount: 'Most viewed'
      },
      quizKind: {
        title: 'TYPE',
        all: 'All types'
      },
      refresh: 'REFRESH',
      searchField: {
        searchRoom: {
          placeholder: 'Search quiz'
        },
        searchRoomOrTag: {
          placeholder: 'Search quiz or #tag'
        }
      },
      empty: {
        description: 'No quizzes found, create your own quiz!',
        action: 'Create a quiz'
      }
    },
    error: {
      rooms: {
        fetch: {
          description: 'There was a problem getting the quizzes',
          action: 'Try again'
        }
      },
      joinRoom: 'Could not go to the quiz, please check the link you entered'
    }
  },
  creatorModeMyRooms: {
    title: 'My recently created quizzes',
    description: {
      authed: '',
      nonAuthed: 'Your recently created quizzes are saved in the browser storage, this list will be cleared when the browser data is reset'
    },
    delete: {
      deleting: 'Deleting quiz...',
      callback: {
        success: 'Quiz deleted'
      }
    },
    listing: {
      public: 'Public',
      private: 'Private'
    }
  },
  flashcardScene: {
    front: 'FRONT',
    back: 'BACK',
    flip: 'Flip',
    tapToFlip: 'Tap the card to flip',
    more: {
      title: 'More',
      shuffle: {
        label: 'Shuffle'
      },
      watchlist: {
        label: 'Watchlist',
        stillProgress: 'Keep',
        inMemory: "Don't show again",
        complete: 'No more cards to show'
      }
    }
  },
  choices: {
    remainingChoices: '{count} choices left',
    lastChoice: 'Last choice',
    winner: {
      title: 'WINNER CHOICE',
      winnerChoices: {
        title: 'Most chosen'
      }
    }
  },
  form: {
    isRequired: '{model} is required',
    isInvalid: '{model} is invalid',
    optionalHint: '(optional)',
    creatorModeCompose: {
      title: 'CREATE A QUIZ',
      choicesTitle: 'CREATE A CHOICES QUIZ',
      flashcardsTitle: 'CREATE A FLASHCARDS QUIZ',
      roomInformations: 'QUIZ INFORMATIONS',
      qaSet: 'QUESTION-ANSWER SET',
      choicesSet: 'CHOICES SET',
      creatingQuiz: 'Creating quiz...',
      updatingQuiz: 'Updating quiz...',
      uploadingMedia: 'Uploading media',
      clearForm: 'Clear Form',
      room: {
        community: {
          pick: 'Pick a community',
          change: 'Change',
          dialogTitle: 'Pick a community',
          empty: "You're not a member of any community.",
          loadFailed: 'Could not load communities.',
          title: 'Share to a community',
          remove: 'Remove',
          anonUnlisted: 'An anonymous unlisted quiz cannot be shared to a community.',
          unlistedNote: "* Your quiz won't appear in public lists, but everyone in the chosen community will see it.",
          shareFailed: 'Quiz saved, but it could not be shared to the community: {reason}'
        },
        roomTitle: {
          label: 'Quiz title',
          placeholder: 'Type quiz title'
        },
        coverPhoto: {
          label: 'Cover photo',
          uploaderTitle: 'Add a cover photo',
          uploaderDescription: 'Click to pick an image, auto-cropped to 16:9',
          hint: 'Quizzes with a cover photo get more attention, it is worth adding one.',
          error: {
            mimeTypeNotAllowed: 'Allowed formats: JPG, PNG, GIF, WEBP',
            sizeLimitExceeded: 'Max file size: 5 MB',
            cropFailed: 'Could not process cover photo',
            uploadFailed: 'Cover photo upload failed'
          }
        },
        description: {
          label: 'Description',
          placeholder: 'Short description about the quiz...'
        },
        moderation: {
          note: 'Moderation note',
          source: 'Source',
          sources: {
            admin: 'Moderator',
            ai: 'AI'
          }
        },
        visibility: {
          label: 'Visibility'
        },
        isListed: {
          systemRemoved: 'This quiz was reviewed: it is not suitable for the quiz list and was removed from it.'
        },
        isAnon: {
          label: 'Creator',
          namedDescription: 'Listed on your quiz profile',
          anonTitle: 'Anonymous',
          anonDescription: 'Your name is not shown anywhere'
        },
        tag: {
          label: 'Tags',
          placeholder: 'Type a tag',
          hint: 'Adding tags makes your quiz stand out and easier to find in search.'
        },
        gameTimeLimit: {
          label: 'Game time',
          minutes: 'Minutes',
          seconds: 'Seconds'
        }
      },
      qa: {
        empty: {
          description: 'Q&A set is empty',
          action: 'Add questions'
        },
        question: {
          photo: 'Photo',
          video: 'Video',
          photoOrVideo: 'Photo/Video',
          addMedia: 'Add media',
          addPhoto: 'Add photo',
          addVideo: 'Add video',
          questionType: {
            title: 'Question type',
            options: {
              text: 'Text',
              media: 'Photo'
            }
          },
          label: 'Question',
          placeholder: 'Type question',
          mediaNote: {
            label: 'Photo note',
            placeholder: 'Type photo note (optional)',
            description: 'The player will see the note related to the photo'
          },
          videoNote: {
            label: 'Video note',
            placeholder: 'Type video note (optional)',
            description: 'The player will see the note related to the video'
          },
          removeQuestion: 'Remove question',
          error: {
            mediaRequired: 'Photo file is required for photo type questions'
          }
        },
        answer: {
          answerType: {
            title: 'Answer type',
            options: {
              textField: 'Text field',
              trivia: 'Trivia'
            },
            trivia: {
              description: 'The player will select from the answers you prepared',
              optionPlaceholder: 'Type answer',
              addOption: 'Add answer',
              correctOption: 'Correct answer selected'
            }
          },
          label: 'Answer',
          placeholder: 'You can separate the answers with commas',
          error: {
            nonMatched: 'Every answer must start with the same character',
            required: 'Answer field is required'
          }
        },
        character: {
          label: 'Character',
          placeholder: 'Question character'
        },
        addMoreQuestion: 'Add more question'
      },
      choices: {
        option: 'Option',
        type: {
          text: 'Text',
          media: 'Media',
          youtube: 'YouTube'
        },
        placeholder: {
          youtube: 'https://www.youtube.com/watch?v=abc1\nhttps://www.youtube.com/watch?v=abc2',
          text: 'Choice 1\nChoice 2\nChoice 3'
        },
        addMedia: 'Add Media',
        empty: {
          description: "You haven't added any choice yet\nAt least 8 choices, at most 256 choices can be added",
          action: 'Add choice'
        },
        addMore: {
          action: 'Add new choice'
        }
      },
      flashcards: {
        set: 'FLASHCARD SET',
        card: 'Card',
        front: {
          label: 'Front',
          placeholder: 'Card front text'
        },
        back: {
          label: 'Back',
          placeholder: 'Card back text'
        },
        removeCard: 'Remove card',
        empty: {
          description: "You haven't added any flashcard yet\nAt least 1 card, at most 100 cards can be added",
          hint: 'In the game screen, the backface of the card is shown first',
          action: 'Add flashcard'
        },
        addMore: {
          action: 'Add new card'
        }
      },
      saveDraft: {
        action: 'Save draft',
        callback: {
          success: 'Saved as draft'
        }
      },
      termsDescription:
        '* Avoid spam, illegal and nsfw content when creating quizzes. Such quizzes will be deleted upon moderation detection. While creating a quiz, your IP address is stored in accordance with legal regulations. In case of violation, legal sanctions may be applied.',
      submit: 'Finish and publish',
      error: {
        couldNotCreate: 'Could not create quiz, please check and try again'
      }
    },
    creatorModeEdit: {
      title: 'EDIT A QUIZ',
      choicesTitle: 'EDIT CHOICES QUIZ',
      flashcardsTitle: 'EDIT FLASHCARDS QUIZ',
      submit: 'Update and publish'
    },
    usernameEdit: {
      usernameField: {
        placeholder: 'Type a player name'
      },
      submit: 'Save',
      callback: {
        success: 'Changed your player name'
      },
      error: {
        submit: 'This player name is not available please type another'
      }
    },
    profileEdit: {
      usernameField: {
        label: 'Username',
        placeholder: 'Type a username'
      },
      fullnameField: {
        label: 'Fullname',
        placeholder: 'Type a fullname'
      },
      bioField: {
        label: 'Bio',
        placeholder: 'Type a bio'
      },
      callback: {
        success: 'Profile information updated'
      },
      avatarSource: {
        label: 'Use',
        diceBear: 'Avatar',
        profilePhoto: 'Profile Photo'
      },
      uploadPhotoButton: 'Upload Profile Photo',
      editAvatarButton: 'Edit Avatar',
      deletePhotoButton: 'Delete',
      deletePhotoCallback: {
        success: 'Profile photo removed'
      },
      deactivate: {
        title: 'Delete Account',
        description:
          'When you delete your account, your data is retained in our system for 90 days as required by law. If you sign in again within this period, your account is reactivated; otherwise your account and all of your data are permanently deleted after 90 days.',
        button: 'Delete My Account',
        confirmTitle: 'Are you sure you want to delete your account?',
        confirmBody:
          'Your account will be retained for 90 days as required by law. Signing in again within this period reactivates it; if you do not sign in, it will be permanently deleted after 90 days.',
        confirmCta: 'Yes, Delete'
      }
    }
  },
  comments: {
    title: 'Comments',
    filter: { comments: 'Comments', ratings: 'Ratings' },
    placeholder: 'Write a comment...',
    loginPlaceholder: 'Log in to comment',
    send: 'Send',
    reply: 'Reply',
    loadMoreReplies: 'Load more replies',
    loadMoreComments: 'Load more comments',
    showReplies: 'Show {n} reply | Show {n} replies',
    deleted: 'This comment was deleted',
    quizOwner: 'Quiz owner',
    report: 'Report',
    delete: 'Delete',
    deleteConfirm: 'Delete this comment?',
    like: 'Like',
    replies: 'Replies',
    replyingTo: 'Replying to {username}',
    rateLimited: 'You are commenting too fast. Try again in 5 minutes.',
    moreTitle: 'Comment options',
    empty: 'No comments yet. Be the first!',
    ratingsEmpty: 'No ratings yet',
    yourRating: 'Your rating: {rating}',
    rateThisQuiz: 'Rate this quiz',
    ratingCount: '({count} players rated)',
    rateConfirm: 'Are you sure you want to give this quiz {rating} stars?',
    rateConfirmButton: 'Rate',
    rated: 'Rating saved',
    alreadyRated: 'You already rated this quiz',
    error: 'Something went wrong, try again'
  },
  notifications: {
    title: 'Notifications',
    tabs: { all: 'All', quizzes: 'My quizzes', interactions: 'Interactions' },
    empty: 'No notifications yet',
    andOthers: '{name} and {count} others',
    types: {
      room_rated: '{actor} rated your quiz {rating}',
      room_commented: '{actor} commented on your quiz',
      comment_replied: '{actor} replied to your comment',
      reply_replied: '{actor} replied to your reply',
      comment_liked: '{actor} liked your comment',
      reply_liked: '{actor} liked your reply',
      community_join_requested: '{actor} wants to join {community}',
      community_join_approved: '{actor} approved your request to join {community}',
      community_member_promoted: '{actor} made you a moderator of {community}',
      community_member_kicked: '{actor} removed you from {community}',
      community_hidden: 'Your community {community} was hidden by moderation',
      post_commented: '{actor} commented on your post in {community}',
      post_liked: '{actor} liked your post in {community}'
    }
  },
  ownerStats: {
    views: 'Views',
    players: 'Players',
    rating: 'Avg rating',
    comments: 'Comments',
    avgCorrect: 'Avg correct',
    avgWrong: 'Avg wrong',
    avgPassed: 'Avg passed',
    avgRemain: 'Avg time left'
  },
  scoreboard: {
    scoreboard: 'Scoreboard',
    pendingScoreboard: 'Fetching scores',
    loginToBeInScoreboard: 'If you play after <u>logging in</u>, you will be in the quiz scoreboard',
    loginToBeInScoreboardExtra: 'If you play without logging in, you will only see your score'
  },
  community: {
    list: {
      title: 'Communities',
      empty: 'No communities yet.',
      emptyJoined: "You haven't joined a community yet.",
      emptyOwned: "You haven't founded a community yet.",
      search: 'Search communities',
      sort: {
        recent: 'Newest',
        memberCount: 'Most members',
        postCount: 'Most posts',
        joined: 'Joined',
        owned: 'Founded by me'
      },
      createButton: 'Create community',
      noMore: "That's all",
      joined: 'Joined',
      pending: 'Pending',
      owned: 'Mine',
      members: '{count} members',
      posts: '{count} posts'
    },
    visibilityMode: {
      public: 'Public',
      publicDescription: 'Shown in quiz lists and search.',
      unlisted: 'Unlisted',
      unlistedDescription: "Won't appear in public lists; reachable by link or through the community's quizzes."
    },
    post: {
      shareTitle: 'Share to a community',
      notePlaceholder: 'Add a note (optional)',
      share: 'Share',
      shared: 'Quiz shared.',
      alreadyShared: 'This quiz is already shared in this community.',
      sharedBadge: 'Shared',
      goToPost: 'Go to post',
      delete: 'Delete post',
      confirmDelete: 'Delete this post? Its comments and likes are deleted too. The quiz itself is not deleted.',
      confirmDeleteText: 'Delete this post? Its comments and likes are deleted too.',
      composerPlaceholder: 'Write something...',
      composerLabel: 'Post to the community',
      publish: 'Post',
      deleted: 'Post deleted.',
      report: 'Report post',
      likes: '{count} likes',
      comments: '{count} comments',
      likeAction: 'Like',
      quizPicker: {
        open: 'Add quiz',
        placeholder: 'Search by quiz name...',
        remove: 'Remove quiz',
        empty: 'No quizzes found.',
        notePlaceholder: 'Add a note (optional)'
      },
      commentAction: 'Comment'
    },
    detail: {
      aboutTitle: 'About',
      createdAt: 'Founded',
      memberCountLabel: 'Members',
      pendingCount: '{count} pending',
      postCountLabel: 'Posts',
      visibility: {
        public: 'Public',
        publicDescription: 'Anyone can see and join.',
        restricted: 'Approval required',
        restrictedDescription: 'Anyone can see it, joining needs approval.',
        private: 'Private',
        privateDescription:
          'Only members can see the community feed and member list, joining needs approval. Quizzes keep their own listing setting.'
      },
      postPermission: {
        everyone: 'All members',
        everyoneDescription: 'All members can share quizzes and posts.',
        modsOnly: 'Moderators only',
        modsOnlyDescription: 'Only the owner and moderators can share quizzes and posts.'
      },
      feedEmpty: 'No posts in this community yet.',
      feedSort: { recent: 'Newest', popular: 'Popular', oldest: 'Oldest' },
      feedTitle: 'Posts',
      privateNotice: 'This community is private. Join to see its quizzes.',
      feedLocked: 'Join this community to see its quizzes',
      menu: { label: 'More', settings: 'Settings', pending: 'Pending', members: 'Members', delete: 'Delete' },
      moderator: 'Moderator',
      owner: 'Owner'
    },
    joinButton: {
      guestJoin: 'Log in to join',
      join: 'Join',
      joining: 'Joining...',
      pending: 'Request sent',
      member: 'Joined',
      owner: 'Manage',
      confirmLeave: 'Are you sure you want to leave this community?',
      confirmCancel: 'Are you sure you want to withdraw your join request?'
    },
    form: {
      name: {
        label: 'Community name',
        placeholder: 'Enter a community name',
        errorRequired: 'Community name is required.',
        errorTooShort: 'Community name must be at least {min} characters.',
        errorTooLong: 'Community name can be at most {max} characters.',
        errorTaken: 'This community name is already taken.'
      },
      description: {
        label: 'Description',
        placeholder: 'Briefly describe your community',
        errorTooLong: 'Description can be at most {max} characters.'
      },
      avatar: { label: 'Community image', uploaderTitle: 'Add an image', hint: 'Click to pick an image, cropped to a square' },
      coverPhoto: { label: 'Cover photo', uploaderTitle: 'Add a cover photo', hint: 'Click to pick an image, cropped to 16:9' },
      tags: {
        label: 'Tags',
        placeholder: 'Enter a tag',
        errorTooMany: 'You can add at most {max} tags.',
        errorInvalid: 'Tags can only contain letters and numbers.',
        addButton: 'Add tag',
        hint: 'Adding tags makes your community stand out and easier to find in search.'
      },
      visibility: { label: 'Visibility' },
      postPermission: { label: 'Who can post?' }
    },
    wizard: {
      title: 'Create community',
      steps: {
        foundations: 'Basics',
        settings: 'Settings',
        complete: 'Finish'
      },
      nextButton: 'Next',
      previousButton: 'Back',
      submitButton: 'Create community',
      creating: 'Creating community...',
      createdSuccess: 'Your community is ready!',
      mediaUploadFailed: "Community created but the image couldn't be uploaded. You can retry from the edit page.",
      noTags: 'No tags added'
    },
    edit: {
      title: 'Edit community',
      saveButton: 'Save',
      slug: 'Address',
      dangerZone: 'Danger zone',
      limitNote: 'A community can be updated at most {limit} times in 7 days.',
      limitLeft: '{count} left this week.',
      limitReached: 'No updates left this week; you can update it again on {date}.'
    },
    members: {
      title: 'Members',
      search: 'Search members',
      empty: 'No members yet.',
      role: { owner: 'Owner', moderator: 'Moderator' },
      actions: {
        kick: 'Remove',
        promote: 'Make moderator',
        demote: 'Remove moderator',
        confirmKick: 'Are you sure you want to remove this member from the community?',
        confirmPromote: 'Are you sure you want to make this member a moderator?',
        confirmDemote: "Are you sure you want to remove this member's moderator role?"
      }
    },
    pending: {
      title: 'Pending requests',
      empty: 'No pending requests.',
      actions: {
        approve: 'Approve',
        reject: 'Reject',
        confirmApprove: 'Are you sure you want to approve this request?',
        confirmReject: 'Are you sure you want to reject this request?'
      }
    },
    delete: {
      title: 'Delete community',
      warning: 'This cannot be undone. The community is deleted, its quizzes are unlinked from it and all memberships end.',
      confirmInput: 'Type the community name to confirm',
      confirmButton: 'Delete community'
    },
    success: {
      created: 'Community created.',
      edited: 'Community updated.',
      deleted: 'Community deleted.',
      joined: 'You joined the community.',
      joinRequested: 'Your join request was sent.',
      left: 'You left the community.',
      requestCanceled: 'Your join request was withdrawn.',
      memberApproved: 'Member approved.',
      memberRejected: 'Request rejected.',
      memberKicked: 'Member removed from the community.',
      memberPromoted: 'Member is now a moderator.',
      memberDemoted: 'Moderator role removed.'
    },
    error: {
      generic: 'Something went wrong. Please try again.',
      networkFailure: 'Connection error. Check your internet and try again.',
      notMember: 'You are not a member of this community.',
      postPermissionDenied: 'Only the owner and moderators can post here.',
      hidden: 'This community is unavailable right now.',
      roomNotShareable: 'This quiz cannot be shared.',
      anonymousQuiz: "Anonymous quizzes can't be shared to communities.",
      alreadyShared: 'This quiz is already shared in this community.',
      ownedLimitReached: 'You can own at most {max} communities.',
      notFound: 'Community not found.'
    },
    notification: {
      joinRequested: '{actor} wants to join {community}',
      joinApproved: 'Your request to join {community} was approved',
      memberPromoted: 'You were made a moderator of {community}',
      memberKicked: 'You were removed from {community}',
      hidden: 'Your community {community} was hidden by moderation'
    },
    hiddenBanner: 'Your community was hidden by moderation. Only you can see it.',
    report: 'Report community',
    profileTab: { title: 'Communities', empty: 'Not a member of any community yet.', more: 'Load more' }
  },
  drawLobby: {
    officialRooms: 'Official Rooms',
    playerRooms: 'Player Rooms'
  },
  gmPanel: {
    communities: {
      title: 'Communities',
      description: 'Search, hide, restore or delete communities.',
      search: 'Search communities',
      onlyHidden: 'Hidden only',
      empty: 'No communities found',
      owner: 'Owner',
      members: 'Members',
      reports: 'Reports',
      hidden: 'Hidden',
      source: 'Source',
      note: 'Note',
      notePlaceholder: 'Moderation note (optional)',
      hide: 'Hide',
      unhide: 'Restore',
      delete: 'Delete',
      confirmHide: 'Are you sure you want to hide this community?',
      confirmUnhide: 'Are you sure you want to make this community visible again?',
      confirmDelete: 'Are you sure you want to permanently delete this community?',
      hiddenDone: 'Community hidden',
      unhiddenDone: 'Community restored',
      deletedDone: 'Community deleted'
    },
    title: 'GM Panel',
    menu: 'GM Panel',
    date: 'Date',
    copy: 'Copy',
    empty: 'No anomalies on this date',
    blocked: 'Blocked',
    blockUser: 'Block player',
    deleteScores: 'Delete scores',
    deleteScore: 'Delete score',
    confirmBlockUser: 'Block {username}? The account will be closed.',
    confirmDeleteScores: "Delete {username}'s score?",
    anomalyCount: '{count} anomalies detected',
    notifyTitle: 'Notice text for the player',
    actionDone: 'Done',
    events: {
      title: 'Events',
      description: 'Make a set free for every player on chosen dates. It ends on its own and the set goes back on sale.',
      list: 'Events',
      empty: 'No events yet',
      add: 'Add event',
      edit: 'Edit event',
      editAction: 'Edit',
      series: 'Set',
      seriesPick: 'Pick a set',
      start: 'Start',
      startDay: 'Start day',
      days: 'Duration (days)',
      end: 'End',
      note: 'Note',
      notePlaceholder: 'Optional short note',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteConfirm: 'Delete the {name} event?',
      saved: 'Saved',
      deleted: 'Deleted',
      status: { active: 'Active', planned: 'Planned', ended: 'Ended' },
      errors: {
        'invalid-series': 'Pick a valid set',
        'invalid-window': 'Invalid date or duration (1-60 days)',
        'invalid-note': 'The note can be at most 200 characters',
        'not-found': 'Event not found'
      }
    },
    commands: {
      title: 'Command Panel',
      description: 'Run GM commands here. Every command is logged.',
      help: 'Commands',
      userArg: 'user',
      amountArg: 'amount',
      noteArg: 'note',
      sendgoldHelp: 'Sends gold to a user (1 - 100,000). Note is optional.',
      example: 'Example',
      placeholder: '/sendgold username 500 gift',
      run: 'Run',
      sent: 'Sent {amount} to {username} • new balance {balance}',
      logs: 'Command log',
      noLogs: 'No commands run yet',
      more: 'Load more',
      ok: 'Success',
      error: 'Error',
      errors: {
        'unknown-command': 'Unknown command',
        'missing-username': 'Username is required',
        'invalid-amount': 'Amount must be a whole number from 1 to 100,000',
        'user-not-found': 'User not found',
        'ambiguous-user': 'Several users match this name with different letter case; use the exact name'
      }
    },
    wordblock: {
      title: 'Wordblock',
      description: 'Players who are first on all of the 5, 6 and 7 letter boards on the same day.',
      anomaly: 'First on 5, 6 and 7 letters'
    },
    ai: {
      title: 'AI Services',
      roomCount: '{count} rooms',
      emptyRooms: 'No rooms yet',
      queue: {
        title: 'Queue ({count})',
        empty: 'No rooms in the queue',
        steps: {
          waiting: 'Waiting',
          moderation: 'Moderating',
          tagging: 'Tagging'
        }
      },
      settings: {
        title: 'Settings',
        description:
          'Reviews rooms that go public with AI and generates 5 tags for rooms without tags. API keys are write-only: a saved key is never shown again, use the pencil icon to enter a new one.',
        provider: 'Provider',
        model: 'Model',
        modelPlaceholder: 'e.g. openai/gpt-oss-20b',
        apiKeys: 'API keys',
        keyNotSet: 'Not set',
        newKey: 'Paste the new key',
        features: 'Features',
        tagGeneration: 'Tag generation',
        tagGenerationHint: 'Adds 5 tags to public rooms that have none',
        roomModeration: 'Room moderation',
        roomModerationHint: 'Removes rooms with profanity, NSFW or private/low-quality content from the list',
        communityModeration: 'Community moderation',
        communityModerationHint: 'Hides communities with inappropriate names, descriptions or tags',
        tagPrompt: 'Tag system prompt',
        moderationPrompt: 'Moderation system prompt'
      },
      taggedRooms: {
        title: 'Tagged',
        description: 'Rooms the AI added tags to. Owners can still change their tags.',
        aiTags: 'AI tags'
      },
      moderatedRooms: {
        title: 'Moderated',
        description: 'Rooms the AI removed from the public list, with the moderation notes.',
        note: 'Moderation note'
      }
    },
    daily: {
      title: 'Daily',
      description: 'Players who finished the daily mode in more than 4 minutes with 25 or more correct answers.',
      anomaly: '{correct} correct · finished in {time}'
    }
  },
  socketStatus: {
    restarting: 'The server is updating, you will reconnect shortly...',
    reconnecting: 'Connection lost, reconnecting...',
    idle: 'You were removed from the room for being inactive for a long time.',
    kicked: 'You were voted out of the room.',
    gmKicked: 'A GM removed you from the room.',
    reconnect: 'Rejoin'
  },
  chat: {
    chat: 'Chat',
    online: 'Online',
    system: 'System'
  },
  tourMode: {
    onlineUsers: 'Online players',
    player: 'Player',
    viewer: 'Viewer',
    results: {
      title: 'Tour Results',
      correctAnswer: 'Correct Answer:',
      empty: {
        description: 'No one has answered yet'
      }
    },
    lastAnswers: {
      title: 'Last Answers',
      empty: {
        title: '',
        description: 'No one has answered yet'
      }
    },
    guessingChance: {
      title: 'GUESSING CHANCE'
    },
    correctAnswer: {
      description: `<h2>✅ &nbsp; CORRECT ANSWER!</h2> <p>Wait for other players' answers</p>`
    },
    wrongAnswer: {
      description: `WRONG ANSWER`
    },
    playerFinishedTheTour: {
      description: `<h2>💔 &nbsp; GUESSING CHANCE ENDED!</h2> <p>Wait until the tour ends</p>`
    }
  },
  musicMode: {
    title: 'Music quiz',
    subtitle: 'Guess the songs or artists',
    form: {
      searchArtist: {
        label: 'Search artist or playlist',
        placeholder: 'Search an artist or playlist... e.g. Rihanna, 90s pop',
        noResult: 'No results found',
        noOptions: 'Start typing to search',
        searching: 'Searching…',
        maxElements: 'Maximum 3 artists can be selected'
      }
    },
    selectedArtists: {
      title: 'Selected artists',
      empty: 'Select an artist to start'
    },
    selectedPlaylist: {
      title: 'Selected playlist'
    },
    play: 'Oyna',
    playHint: 'Search and select an artist or playlist',
    popularArtists: 'Featured artists',
    playlists: 'Featured playlists',
    tagResults: {
      noMore: "That's all",
      empty: 'No results found'
    },
    groups: {
      artists: 'Artists',
      playlists: 'Playlists'
    },
    guessTheSong: {
      title: 'Music quiz',
      subtitle: 'Listen to songs and guess them',
      pickSong: 'Which song is playing?',
      stats: {
        score: 'Score',
        selectedArtists: 'Selected artists',
        playlist: 'Playlist',
        backToMusicMode: 'Back to music quiz'
      }
    },
    nextRound: 'Next round',
    seeResults: 'See results',
    appleMusic: 'Apple Music'
  },
  wordblockMode: {
    wordblock: 'Wordblock',
    title: 'Wordblock - {charLength} letters',
    otherLengths: 'Play other modes',
    letter: 'Letter'
  },
  geoGuessMode: {
    title: 'GeoGuess',
    description: 'Guess where the street photo was taken and mark it on the map',
    panoramaTitle: 'Street view',
    chooseRegion: 'Choose a region',
    regions: {
      world: { title: 'World', description: 'Streets from every continent' },
      europe: { title: 'Europe', description: 'European cities and towns' },
      turkey: { title: 'Türkiye', description: 'All around Türkiye' },
      usa: { title: 'USA', description: 'Coast to coast across the States' }
    },
    rules: {
      rounds: '{count} rounds, a new street each round',
      timer: 'You have {minutes} minutes per round, the clock ticks in the last 10 seconds',
      maxScore: 'Up to {score} points per round, the closer the better',
      explore: 'Walk down the street, look around, read the signs and roads for clues',
      mark: 'Mark where you think you are on the map and guess'
    },
    stats: {
      rounds: '{count} rounds',
      timer: '{minutes} min / round',
      maxScore: '{score} points'
    },
    howToPlay: 'How to play?',
    play: 'PLAY',
    timeLeft: 'Time left',
    timeUp: "Time's up, no guess made",
    points: '{score} points',
    you: 'You',
    target: 'Target',
    start: 'START',
    preparing: 'Preparing locations',
    notEnoughLocations: 'No locations found, try again',
    round: 'Round',
    score: 'Score',
    openMap: 'Open map',
    closeMap: 'Close map',
    pickOnMap: 'MARK ON THE MAP',
    openMapHint: 'Tap the map to guess',
    guess: 'GUESS',
    distance: 'Your guess was {distance} away',
    next: 'NEXT ROUND',
    seeResults: 'SEE RESULTS',
    totalScore: 'Total score',
    playAgain: 'PLAY AGAIN',
    changeRegion: 'Change region',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen'
  },
  period: {
    daily: {
      title: 'Daily',
      slug: 'day'
    },
    weekly: {
      title: 'Weekly',
      slug: 'week'
    },
    monthly: {
      title: 'Monthly',
      slug: 'month'
    },
    season: {
      title: '{seasonYear} Season',
      slug: 'season'
    }
  },
  leaderboard: {
    title: 'Leaderboard',
    modeTitle: '{mode} mode leaderboard',
    daily: {
      short: 'Daily',
      full: 'Daily leaderboard',
      scoredPoints: 'Points scored today',
      leaderSorting: `Today's leaderboard`
    },
    weekly: {
      short: 'Weekly',
      full: 'Weekly leaderboard',
      scoredPoints: 'Points scored this week (Monday-Sunday)',
      leaderSorting: `This week's (Monday-Sunday) leaderboard`
    },
    monthly: {
      short: 'Monthly',
      full: 'Monthly leaderboard',
      scoredPoints: 'Points scored this month ({startDate} - {endDate})',
      leaderSorting: `This month's ({startDate} - {endDate}) leaderboard`
    },
    season: {
      short: '{seasonYear} Season',
      full: '{seasonYear} season leaderboard',
      scoredPoints: 'Points scored this season',
      leaderSorting: `This season's leaderboard`
    },
    pending: 'Leaderboard is being fetched',
    // The row pinned above the list, showing the reader their own place on the board
    yourRank: {
      label: 'Your Rank',
      short: 'You'
    },
    error: {
      fetch: {
        description: 'Leaderboard could not be fetched',
        action: 'Try again'
      }
    },
    empty: {
      description: 'No one has entered the leaderboard yet'
    }
  },
  seo: {
    main: {
      title: 'parolla - Word game',
      description: 'Solve daily questions and join the competition. Create your own quiz and solve quizzes created by players'
    },
    dailyMode: {
      title: 'Daily word game',
      description: 'parolla - Word game - Daily word game, solve daily questions and join the competition'
    },
    unlimitedMode: {
      title: 'Unlimited',
      description: 'Unlimited question set, solve questions, play word game'
    },
    drawLobby: {
      title: 'Draw',
      description:
        'Real-time draw and guess game. Join official rooms with friends, create your own room, and draw / guess words from curated categories.',
      keywords: 'draw mode, drawing game, word guess, multiplayer drawing, parolla draw'
    },
    drawRoom: {
      title: 'Draw Room',
      description: 'Join a draw mode room. Take turns drawing while everyone races to guess the word.',
      keywords: 'draw room, online drawing, word guess, parolla draw room'
    },
    creatorModeCompose: {
      title: 'Create a quiz',
      description: 'Create a quiz or solve quizzes created by players',
      keywords: 'quiz game, quiz solve, quiz create'
    },
    creatorModeComposeChoices: {
      title: 'Create a choices quiz',
      description: 'Create a choices quiz or solve quizzes created by players',
      keywords: 'choices quiz, quiz solve, quiz create'
    },
    creatorModeComposeFlashcards: {
      title: 'Create Flashcards Quiz',
      description: 'Create a flashcard quiz for studying',
      keywords: 'flashcards, quiz, study, learning'
    },
    communityList: {
      title: 'Communities, share quizzes around shared interests',
      description: 'Join communities, start your own and share quizzes together',
      keywords: 'communities, quiz community, share quiz'
    },
    creatorModeQuizzes: {
      title: 'Quizzes, solve quizzes or create your own quiz',
      description: 'Solve quizzes created by players or create your own quiz',
      keywords: 'quiz game, quiz solve, quiz create'
    },
    creatorModeQuiz: {
      title: '{quizTitle} quiz',
      description: 'Solve the "{quizTitle}" quiz!',
      keywords: 'quiz game, quiz solve, quiz create'
    },
    tourMode: {
      title: 'Tour',
      description: 'Answer the question in each round, instant competition'
    },
    wordblockMode: {
      title: 'Wordblock - {charLength} letters',
      description: `Guess the {charLength} letter word in 6 attempts, daily word game`,
      keywords: 'daily word game, wordle, like wordle, word guess game'
    },
    musicMode: {
      guessTheSong: {
        title: 'Listen to songs and guess them - Music quiz',
        description: 'Listen to songs and guess them in the music quiz',
        keywords: 'music quiz, music quiz play, listen to songs and guess them'
      },
      guessTheSongPlay: {
        title: '{artists} songs listen and guess them - Music quiz',
        description: 'Listen to {artists} songs and guess them in the music quiz',
        keywords: 'music quiz, music quiz play, listen to songs and guess them'
      }
    },
    geoGuessMode: {
      title: 'GeoGuess - Guess the location from street view',
      description: 'Guess where the street photo was taken and mark it on the map. World, Europe and Türkiye rounds.',
      keywords: 'geoguess, geoguessr, location guessing game, street view game, map game, geography game'
    }
  },
  activities: {
    title: 'Activities',
    tabs: { likes: 'My likes', comments: 'My comments', goldHistory: 'Gold history' },
    likesEmpty: "You haven't liked any comments yet.",
    commentsEmpty: "You haven't written any comments yet.",
    likesError: 'Could not load your likes.',
    replyTo: 'Reply to a comment'
  },
  profile: {
    tabs: {
      quizzes: 'Quizzes',
      reviews: 'Comments',
      scores: 'Scores',
      achievements: 'Achievements',
      communities: 'Communities'
    },
    stats: {
      created: 'Created',
      played: 'Played',
      reviews: 'Comments'
    },
    scoresSubTabs: {
      creator: 'Creator',
      tour: 'Tour Mode'
    },
    actions: {
      goToProfile: 'Go to profile',
      report: 'Report'
    },
    editButton: 'Edit profile',
    notFound: {
      title: 'User not found',
      action: 'Back to home'
    },
    quizzesTab: {
      empty: 'No quizzes created yet.',
      error: 'Could not load quizzes.'
    },
    reviewsTab: {
      empty: 'No comments written yet.',
      error: 'Could not load comments.',
      replied: 'Reply sent'
    },
    scoresTab: {
      tour: { title: 'Tour mode scores' },
      room: {
        title: 'Played quiz scores',
        empty: 'No quizzes played yet.',
        error: 'Could not load scores.',
        statsLine: '{correct} correct · {wrong} wrong · {passed} passed'
      }
    }
  },
  account: {
    edit: { title: 'Edit profile' }
  },
  page: {
    legal: {
      updatedAt: 'Last updated: {date}'
    }
  },
  playIntro: {
    play: 'START GAME',
    share: 'Share',
    shareToCommunity: 'Share to community',
    rate: 'Rate',
    howToPlay: 'How to play?',
    creator: 'Created by',
    anon: 'Anonymous',
    daily: 'DAILY',
    unlimited: 'UNLIMITED',
    rating: '{rating} /5',
    raters: '({count})',
    views: '{count} view | {count} views',
    questions: '{count} question | {count} questions',
    choices: '{count} choice | {count} choices',
    flashcards: '{count} card | {count} cards',
    comments: '{count} comment | {count} comments',
    timeLimit: '{minutes} min',
    letters: '{count} letter | {count} letters',
    leaderboard: 'Leaderboard',
    fullScoreboard: 'Full scoreboard',
    dailyLeaderboard: 'See full ranking',
    noScores: 'Nobody has played yet. Be the first!'
  },
  common: {
    invalidUsername: 'Invalid username',
    guestLabel: '(guest)'
  }
}
