(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* -------------------------------------------------------
     Header, scroll progress & current section
     ------------------------------------------------------- */

  const header = $('[data-header]');
  const progressBar = $('[data-scroll-progress]');
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle('is-scrolled', scrollY > 24);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(scrollY / max, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    scrollTicking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        window.requestAnimationFrame(updateScrollUI);
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  const sectionLinks = new Map();
  $$('.desktop-nav a').forEach((link) => {
    const hash = link.getAttribute('href');
    if (hash && hash.startsWith('#')) sectionLinks.set(hash.slice(1), link);
  });

  if ('IntersectionObserver' in window && sectionLinks.size) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          $$('.desktop-nav a').forEach((link) => link.classList.remove('is-current'));
          const link = sectionLinks.get(entry.target.id);
          link?.classList.add('is-current');
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );

    sectionLinks.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  /* -------------------------------------------------------
     Mobile menu
     ------------------------------------------------------- */

  const menu = $('[data-menu]');
  const menuOpen = $('[data-menu-open]');
  const menuClose = $('[data-menu-close]');
  const siteHeader = $('.site-header');
  const main = $('#main');
  const footer = $('.site-footer');
  let lastFocused = null;

  const menuFocusable = () =>
    $$('a[href], button:not([disabled])', menu).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length
    );

  const openMenu = () => {
    if (!menu || !menuOpen) return;
    lastFocused = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOpen.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    if (siteHeader) siteHeader.inert = true;
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    window.setTimeout(() => menuClose?.focus(), 80);
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!menu || !menuOpen) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOpen.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    if (siteHeader) siteHeader.inert = false;
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    if (restoreFocus) {
      (lastFocused instanceof HTMLElement ? lastFocused : menuOpen).focus();
    } else if (document.activeElement instanceof HTMLElement && menu.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  menuOpen?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', () => closeMenu());

  $$('[data-menu-link]', menu || document).forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  document.addEventListener('keydown', (event) => {
    if (!menu?.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;
    const items = menuFocusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !menu.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* -------------------------------------------------------
     Hero parallax
     ------------------------------------------------------- */

  const hero = $('.hero');
  const heroShell = $('.hero-image-shell');

  if (hero && heroShell && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    let pointerX = 0;
    let pointerY = 0;
    let heroTicking = false;

    const renderHero = () => {
      const scrollShift = Math.min(window.scrollY * 0.045, 18);
      heroShell.style.transform = `translate3d(${pointerX}px, ${pointerY + scrollShift}px, 0)`;
      heroTicking = false;
    };

    const requestHeroRender = () => {
      if (!heroTicking) {
        heroTicking = true;
        window.requestAnimationFrame(renderHero);
      }
    };

    hero.addEventListener(
      'pointermove',
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        pointerX = x * 5;
        pointerY = y * 4;
        requestHeroRender();
      },
      { passive: true }
    );

    hero.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
      requestHeroRender();
    });

    window.addEventListener('scroll', requestHeroRender, { passive: true });
    renderHero();
  }

  /* -------------------------------------------------------
     Countdown
     ------------------------------------------------------- */

  const countdown = $('[data-countdown]');
  if (countdown) {
    const target = new Date('2027-05-12T18:00:00+07:00').getTime();
    const updateCountdown = () => {
      const diff = target - Date.now();
      const days = diff > 0 ? Math.ceil(diff / 86400000) : 0;
      countdown.textContent = days > 0 ? String(days) : '00';
    };
    updateCountdown();
    window.setInterval(updateCountdown, 60000);
  }

  /* -------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------- */

  const revealElements = $$('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  /* -------------------------------------------------------
     Statistic counters
     ------------------------------------------------------- */

  const stats = $$('[data-count]');

  const setFinalCount = (el) => {
    const target = Number(el.dataset.count) || 0;
    el.textContent = String(target).padStart(2, '0');
  };

  const animateCount = (el) => {
    const target = Number(el.dataset.count) || 0;
    if (prefersReducedMotion) {
      setFinalCount(el);
      return;
    }

    const duration = 1050;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value).padStart(2, '0');
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        setFinalCount(el);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (stats.length) {
    if (!('IntersectionObserver' in window)) {
      stats.forEach(setFinalCount);
    } else {
      const statObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.55 }
      );
      stats.forEach((el) => statObserver.observe(el));
    }
  }

  /* -------------------------------------------------------
     Designer filtering
     ------------------------------------------------------- */

  const filterButtons = $$('[data-filter]');
  const designerCards = $$('[data-designer]');
  const designerCount = $('[data-designer-count]');

  if (designerCount) designerCount.setAttribute('aria-live', 'polite');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      let visible = 0;

      filterButtons.forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });

      designerCards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !matches);
        if (matches) {
          visible += 1;
          card.style.animation = 'none';
          void card.offsetWidth;
          card.style.animation = '';
        }
      });

      if (designerCount) designerCount.textContent = String(visible).padStart(2, '0');
    });
  });

  /* -------------------------------------------------------
     Toast
     ------------------------------------------------------- */

  const toast = $('[data-toast]');
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
  };

  /* -------------------------------------------------------
     Designer dialog
     ------------------------------------------------------- */

  const designerDialog = $('#designer-dialog');

  const designers = {
    nara: {
      name: 'NARA',
      meta: 'Medan / Womenswear',
      bio: 'NARA mengolah songket Deli menjadi siluet malam yang ringan dan modern. Koleksi perdananya adalah dialog antara benang emas neneknya dan kota yang terus berubah.',
      show: 'Rabu, 12 Mei — 19:30 / The Atrium',
      image: 'assets/img/designer-nara.webp',
      alt: 'Koleksi gaun pink NARA'
    },
    rumah: {
      name: 'RUMAH SONGKET',
      meta: 'Medan / Textile atelier',
      bio: 'Rumah Songket adalah kolektif penenun dan desainer muda di Medan. Mereka bekerja lintas generasi untuk membawa tenun ke potongan yang relevan, tanpa kehilangan jejak tangan pembuatnya.',
      show: 'Kamis, 13 Mei — 15:00 / The Atrium',
      image: 'assets/img/designer-rumah.webp',
      alt: 'Potret desainer Rumah Songket'
    },
    kilat: {
      name: 'KILAT',
      meta: 'Jakarta / Menswear',
      bio: 'Berbasis di Jakarta, KILAT membongkar tailoring klasik menjadi sesuatu yang lebih longgar, terang, dan tidak sopan pada tempatnya.',
      show: 'Kamis, 13 Mei — 19:30 / Mansion Lawn',
      image: 'assets/img/designer-kilat.webp',
      alt: 'Model pria KILAT dengan setelan abu-abu'
    },
    maya: {
      name: 'MAYA SIMANJUNTAK',
      meta: 'Medan / Womenswear',
      bio: 'Maya Simanjuntak bekerja di persimpangan rias, mode, dan memori. Wajah adalah arsip; setiap lapisan menyimpan cerita yang tidak selalu terlihat.',
      show: 'Kamis, 13 Mei — 17:30 / Kesawan Room',
      image: 'assets/img/designer-maya.webp',
      alt: 'Potret beauty editorial Maya Simanjuntak'
    },
    toko: {
      name: 'TOKO TIGA',
      meta: 'Yogyakarta / Contemporary',
      bio: 'Toko Tiga percaya bahwa pakaian sehari-hari bisa terasa aneh tanpa harus berteriak. Potongan sederhana, detail yang mengganggu, dipakai berulang.',
      show: 'Jumat, 14 Mei — 14:00 / The Atrium',
      image: 'assets/img/designer-toko.webp',
      alt: 'Busana putih kontemporer Toko Tiga'
    },
    aria: {
      name: 'ARIA & CO.',
      meta: 'Bandung / Contemporary',
      bio: 'Aria & Co. menangkap tekstur kota Bandung: trotoar, cahaya sore, dan orang-orang yang berjalan cepat. Koleksinya tenang, tetapi tidak pernah diam.',
      show: 'Jumat, 14 Mei — 21:00 / The Atrium',
      image: 'assets/img/designer-aria.webp',
      alt: 'Model perempuan Aria & Co. dengan kacamata hitam'
    },
    sere: {
      name: 'SERE',
      meta: 'Bali / Resortwear',
      bio: 'Sere merancang untuk udara panas dan tubuh yang bergerak. Bahan ringan, potongan terbuka, dan warna yang terasa seperti pulang.',
      show: 'Jumat, 14 Mei — 19:00 / Mansion Lawn',
      image: 'assets/img/designer-sere.webp',
      alt: 'Dua model dengan busana resortwear Sere'
    },
    lokan: {
      name: 'LOKAN',
      meta: 'Medan / Streetwear',
      bio: 'Lokan adalah proyek dua sosok dari Medan yang memakai jalanan sebagai studio. Kostum, musik, dan sikap bercampur dalam satu pernyataan.',
      show: 'Jumat, 14 Mei — 16:30 / Courtyard',
      image: 'assets/img/designer-lokan.webp',
      alt: 'Dua model dengan kostum avant-garde Lokan'
    }
  };

  const openDesignerDialog = (id) => {
    const data = designers[id];
    if (!data || !designerDialog) return;

    const name = $('[data-designer-name]', designerDialog);
    const meta = $('[data-designer-meta]', designerDialog);
    const bio = $('[data-designer-bio]', designerDialog);
    const show = $('[data-designer-show]', designerDialog);
    const image = $('[data-designer-image]', designerDialog);

    if (name) name.textContent = data.name;
    if (meta) meta.textContent = data.meta;
    if (bio) bio.textContent = data.bio;
    if (show) show.textContent = data.show;
    if (image) {
      image.src = data.image;
      image.alt = data.alt;
    }

    designerDialog.showModal();
    body.classList.add('dialog-open');
  };

  designerCards.forEach((card) => {
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-controls', 'designer-dialog');
    card.addEventListener('click', (event) => {
      event.preventDefault();
      openDesignerDialog(card.dataset.designer);
    });
  });

  $('[data-designer-schedule]', designerDialog || document)?.addEventListener('click', (event) => {
    event.preventDefault();
    designerDialog?.close();
    scrollToHash('#schedule');
  });

  /* -------------------------------------------------------
     Journal dialog
     ------------------------------------------------------- */

  const articleDialog = $('#article-dialog');

  const articles = {
    backstage: {
      meta: 'Journal / Di balik panggung / 6 menit baca',
      title: 'Malam sebelum lampu menyala',
      paragraphs: [
        'Pukul empat sore, lorong Tjong A Fie Mansion sudah penuh kabel, kotak peralatan, dan orang-orang yang berbicara pelan. Di ruang rias, lampu menyala lebih terang dari matahari sore. Seorang model duduk diam sementara dua pasang tangan bekerja di wajahnya.',
        'Yang tidak terlihat di runway adalah waktu. Lapisan demi lapisan, cek ulang, jarum pentul, dan napas panjang sebelum pintu dibuka. Di balik setiap koleksi ada tim yang belajar saling percaya dalam hitungan jam.',
        'Malam itu, ketika lampu akhirnya menyala, semua kepanikan berubah menjadi ketenangan. Itulah momen yang kami coba tangkap — bukan kesempurnaan, tetapi keberanian untuk melangkah.'
      ]
    },
    detail: {
      meta: 'Journal / Craft / 4 menit baca',
      title: 'Detail yang tak terlihat',
      paragraphs: [
        'Sebuah gaun bisa terlihat sederhana dari kejauhan. Baru ketika kamu mendekat, kamu melihat pekerjaannya: payet yang dijahit satu per satu, tepi yang diselesaikan dengan tangan, dan benang yang hampir tidak terlihat.',
        'Di MFW 2027, kami ingin memberi ruang pada detail. Bukan hanya untuk difoto, tetapi untuk dihargai. Karena di situlah waktu, keterampilan, dan kesabaran seorang perajin benar-benar tinggal.',
        'Koleksi yang baik tidak berteriak. Ia menunggu untuk ditemukan.'
      ]
    },
    kesawan: {
      meta: 'Journal / City / 5 menit baca',
      title: 'Kesawan setelah jam lima',
      paragraphs: [
        'Jam lima sore, Kesawan berubah. Toko-toko mulai menutup, tetapi trotoar justru ramai. Anak-anak muda datang dengan sepatu yang tidak cocok, jaket warisan ayah, dan potongan yang mereka jahit sendiri.',
        'Mereka tidak sedang menunggu diundang ke runway. Mereka sudah punya panggung: gang, warung kopi, dan depan gedung tua. Mode di sini bukan tentang tren; ia tentang cara mengambil ruang.',
        'MFW ingin mendengarkan suara itu. Bukan untuk menjadikannya konsumsi, tetapi untuk membuka pintu yang selama ini hanya bisa dilihat dari luar.'
      ]
    }
  };

  const openArticleDialog = (id) => {
    const data = articles[id];
    if (!data || !articleDialog) return;

    const meta = $('[data-article-meta]', articleDialog);
    const title = $('[data-article-title]', articleDialog);
    const articleBody = $('[data-article-body]', articleDialog);

    if (meta) meta.textContent = data.meta;
    if (title) title.textContent = data.title;
    if (articleBody) {
      articleBody.replaceChildren();
      data.paragraphs.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        articleBody.appendChild(paragraph);
      });
    }

    articleDialog.showModal();
    body.classList.add('dialog-open');
  };

  $$('[data-article]').forEach((card) => {
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-controls', 'article-dialog');
    card.addEventListener('click', (event) => {
      event.preventDefault();
      openArticleDialog(card.dataset.article);
    });
  });

  /* -------------------------------------------------------
     Dialog shared behaviour
     ------------------------------------------------------- */

  $$('dialog').forEach((dialog) => {
    $$('[data-close-dialog]', dialog).forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) body.classList.remove('dialog-open');
    });
  });

  /* -------------------------------------------------------
     Schedule tabs
     ------------------------------------------------------- */

  const dayTabs = $$('.day-tab');
  const dayPanels = $$('.day-panel');

  const activateDay = (tab) => {
    if (!tab) return;
    const panelId = tab.getAttribute('aria-controls');

    dayTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    dayPanels.forEach((panel) => {
      panel.classList.remove('is-active');
      if (panel.id === panelId) {
        void panel.offsetWidth;
        panel.classList.add('is-active');
      }
    });
  };

  dayTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateDay(tab));

    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + dayTabs.length) % dayTabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % dayTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = dayTabs.length - 1;

      const nextTab = dayTabs[nextIndex];
      activateDay(nextTab);
      nextTab.focus();
    });
  });

  /* -------------------------------------------------------
     Save shows (local, private)
     ------------------------------------------------------- */

  const saveKey = 'mfw-2027-saved-shows';
  let savedShows = new Set();

  try {
    const stored = window.localStorage.getItem(saveKey);
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) savedShows = new Set(parsed);
  } catch (error) {
    savedShows = new Set();
  }

  const persistSavedShows = () => {
    try {
      window.localStorage.setItem(saveKey, JSON.stringify(Array.from(savedShows)));
    } catch (error) {
      /* Storage can be unavailable in private contexts. The UI still works. */
    }
  };

  $$('.save-show').forEach((button) => {
    const item = button.closest('li');
    const title = item?.dataset.title;
    if (!title) return;

    const setPressed = (pressed) => {
      button.setAttribute('aria-pressed', String(pressed));
      button.setAttribute(
        'aria-label',
        `${pressed ? 'Hapus' : 'Simpan'} ${title} ${pressed ? 'dari' : 'ke'} daftar`
      );
    };

    setPressed(savedShows.has(title));

    button.addEventListener('click', () => {
      const isSaved = savedShows.has(title);
      if (isSaved) {
        savedShows.delete(title);
        showToast(`Dihapus dari daftar: ${title}`);
      } else {
        savedShows.add(title);
        showToast(`Disimpan ke daftar: ${title}`);
      }
      setPressed(!isSaved);
      persistSavedShows();
    });
  });

  /* -------------------------------------------------------
     Download schedule as .ics
     ------------------------------------------------------- */

  const formatICSDate = (date) =>
    date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

  const escapeICS = (value) =>
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

  const foldICSLine = (line) => {
    if (line.length <= 73) return line;
    const chunks = [];
    let remainder = line;
    while (remainder.length > 73) {
      chunks.push(remainder.slice(0, 73));
      remainder = remainder.slice(73);
    }
    chunks.push(remainder);
    return chunks.join('\r\n ');
  };

  const downloadCalendar = () => {
    const now = formatICSDate(new Date());
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Medan Fashion Week//MFW 2027//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Medan Fashion Week 2027',
      'X-WR-TIMEZONE:Asia/Jakarta'
    ];

    let index = 0;
    $$('.day-panel').forEach((panel) => {
      const date = panel.dataset.date;
      if (!date) return;

      $$('.timeline li', panel).forEach((item) => {
        const time = item.dataset.time;
        const title = item.dataset.title;
        const venue = item.dataset.venue;
        if (!time || !title) return;

        const start = new Date(`${date}T${time}:00+07:00`);
        const end = new Date(start.getTime() + 75 * 60 * 1000);
        index += 1;

        lines.push(
          'BEGIN:VEVENT',
          foldICSLine(`UID:mfw-2027-${index}-${date}@medanfashionweek.id`),
          `DTSTAMP:${now}`,
          `DTSTART:${formatICSDate(start)}`,
          `DTEND:${formatICSDate(end)}`,
          foldICSLine(`SUMMARY:${escapeICS(`MFW 2027 — ${title}`)}`),
          foldICSLine(
            `LOCATION:${escapeICS(`Tjong A Fie Mansion — ${venue || 'Medan'}, Medan, Indonesia`)}`
          ),
          foldICSLine(
            `DESCRIPTION:${escapeICS(
              `Medan Fashion Week 2027. ${title} di ${venue || 'Tjong A Fie Mansion'}, Medan. Pintu dibuka 30 menit sebelum sesi.`
            )}`
          ),
          'END:VEVENT'
        );
      });
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/calendar;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'medan-fashion-week-2027.ics';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Jadwal MFW 2027 diunduh. Sampai jumpa di Medan.');
  };

  $('[data-add-calendar]')?.addEventListener('click', downloadCalendar);

  /* -------------------------------------------------------
     Newsletter form
     ------------------------------------------------------- */

  const newsletterForm = $('[data-newsletter]');
  const formNote = $('[data-form-note]');

  if (newsletterForm) {
    const input = $('input[type="email"]', newsletterForm);
    const submit = $('button[type="submit"]', newsletterForm);

    input?.addEventListener('input', () => {
      formNote?.classList.remove('is-error', 'is-success');
      if (formNote) {
        formNote.textContent =
          'Kami hanya mengirim kabar yang layak dibaca. Bisa berhenti kapan saja.';
      }
    });

    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!input || !formNote) return;

      if (!input.value.trim() || !input.checkValidity()) {
        formNote.textContent = 'Masukkan alamat email yang valid, ya.';
        formNote.classList.remove('is-success');
        formNote.classList.add('is-error');
        input.focus();
        return;
      }

      formNote.textContent = `Kamu masuk daftar. Sampai jumpa di Medan, ${input.value
        .split('@')[0]
        .slice(0, 24)}.`;
      formNote.classList.remove('is-error');
      formNote.classList.add('is-success');

      if (submit) {
        submit.disabled = true;
        submit.querySelector('span')?.replaceChildren(document.createTextNode("You're in"));
      }

      input.disabled = true;
      showToast('Terima kasih. Kabar pertama akan datang dari Medan.');
    });
  }

  /* -------------------------------------------------------
     Back to top
     ------------------------------------------------------- */

  $('[data-back-top]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* -------------------------------------------------------
     Precise in-page navigation
     ------------------------------------------------------- */

  function scrollToHash(hash, { updateHistory = true } = {}) {
    if (!hash || hash === '#') return false;
    const id = hash.slice(1);
    if (!id || id === 'designer-dialog' || id === 'article-dialog') return false;

    const target = document.getElementById(id);
    if (!target) return false;

    if (menu?.classList.contains('is-open')) closeMenu({ restoreFocus: false });

    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      if (updateHistory) window.history.pushState(null, '', '#top');
      return true;
    }

    const anchor =
      target.querySelector('.section-top') ||
      target.querySelector('.newsletter-copy') ||
      target.querySelector('.eyebrow') ||
      target;

    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const top = Math.max(
      0,
      anchor.getBoundingClientRect().top + window.scrollY - headerHeight - 22
    );

    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    if (updateHistory) window.history.pushState(null, '', hash);
    return true;
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    if (link.classList.contains('skip-link')) return;
    if (link.hasAttribute('data-designer') || link.hasAttribute('data-article')) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    if (hash === '#designer-dialog' || hash === '#article-dialog') return;

    if (scrollToHash(hash)) event.preventDefault();
  });

  if (window.location.hash && window.location.hash.length > 1) {
    window.addEventListener('load', () => {
      window.setTimeout(() => scrollToHash(window.location.hash, { updateHistory: false }), 80);
    });
  }
})();
