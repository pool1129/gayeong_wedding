document.addEventListener("DOMContentLoaded", () => {
  //데이터 바인드
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const path = el.dataset.bind.split(".");
    const attr = el.dataset.bindAttr;
    let value = WEDDING_DATA;

    path.forEach((k) => (value = value?.[k]));
    if (value == null) return;

    // ✅ title 태그는 textContent로
    if (el.tagName === "TITLE") {
      el.textContent = value;
      return;
    }

    // ✅ meta 등은 content 속성
    if (attr) {
      el.setAttribute(attr, value);
    } else {
      el.textContent = value;
    }
  });

  //색상 바인드
  document.documentElement.style.setProperty(
    "--main-color",
    WEDDING_DATA.WEDDING.MAIN_COLOR,
  );
  document.documentElement.style.setProperty(
    "--font-color",
    WEDDING_DATA.WEDDING.FONT_COLOR,
  );

  initBgm();
  initMap();
  initNoticeTabs();
  initCheckLocation()
  preventImageSaveActions();
});

let countdownTimer = null;
const NOTICE_TAB_CONTENTS = [
  `예식 참석이 어려운 분들을 위해\n 혼례에 앞서 피로연 자리를 마련하였습니다. \n
  혼주 진광석 · 김경미 \n
  2026년 05월 02일 토요일 오전 11시 \n
  철원 태봉 웨딩홀 
  강원 철원군 서면 와수로 110번안길 18-2`,
  //   `드레스코드는 세미 포멀입니다.
  // · 화이트/아이보리 계열 의상은 신부를 위해 피해주시면 감사하겠습니다.`,
  //   `· 예식: 3F 메인홀
  // · 식전 웰컴존: 4F 루프탑
  // · 식사: 예식 후 동일 건물 연회장에서 진행됩니다.`,
];

// 결혼식 날짜 설정
const WEDDING_DATE = WEDDING_DATA.WEDDING.DATE;
const WEDDING_TIME = WEDDING_DATA.WEDDING.TIME;

// 달력 생성
const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// 특정위치에서는 갤러리 미노출
const targetLat = 37.56129332113698;
const targetLng = 126.82541086584348;
const radius = 100;

function toRad(value) {
  return (value * Math.PI) / 180;
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 위치 확인
function initCheckLocation() {
  const targetSection = document.getElementById("gallery");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;

      const distance = getDistance(currentLat, currentLng, targetLat, targetLng);

      if (distance <= radius) {
        targetSection.style.display='block';
      } else {
        targetSection.style.display='none';
      }
    },
    (error) => {
       console.log(error)
    }
  );
}

function generateCalendar() {
  const [year, month, day] = WEDDING_DATE.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = dayNames[date.getDay()];
  const formattedDate = `${year}.${String(month).padStart(2, "0")}.${String(
    day,
  ).padStart(2, "0")}. ${dayOfWeek}`;

  document.getElementById("calendarDate").textContent = formattedDate;
  document.getElementById("calendarTime").textContent = WEDDING_TIME;

  renderCalendar(year, month, day);
  renderDday();
}

// 예식일 Date 객체 생성(디데이 계산용)
function getWeddingDateTime() {
  const weddingDate = getWeddingDateString();
  const weddingTime = getWeddingTimeString();
  const [year, month, day] = weddingDate.split("-").map(Number);
  const match = String(weddingTime)
    .trim()
    .match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  let hours = 12;
  let minutes = 0;

  if (match) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
    const period = (match[3] || "").toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
}

// 예식 날짜 문자열(YYYY-MM-DD)을 안전하게 계산
function getWeddingDateString() {
  const wedding = WEDDING_DATA.WEDDING || {};
  if (wedding.DATE) return wedding.DATE;

  const text = String(wedding.DATE_TIME_TEXT || "");
  const match = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${String(Number(m)).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
  }

  return "2026-06-20";
}

// 예식 시간 문자열(HH:MMAM/PM)을 안전하게 계산
function getWeddingTimeString() {
  const wedding = WEDDING_DATA.WEDDING || {};
  if (wedding.TIME) return String(wedding.TIME);

  const text = String(wedding.DATE_TIME_TEXT || "");
  const match = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  if (match?.[1]) {
    return match[1].replace(/\s+/g, "").toUpperCase();
  }

  return "12:00PM";
}

// 디데이(일/시/분/초) 카운트다운 렌더 및 타이머 등록
function renderDday() {
  const ddayEl = document.getElementById("calendarDday");
  if (!ddayEl) return;

  const weddingDateTime = getWeddingDateTime();

  const update = () => {
    const now = new Date();
    // 예식 전/후 모두 양수 카운트다운으로 표시
    let diffSeconds = Math.floor(
      Math.abs(weddingDateTime.getTime() - now.getTime()) / 1000,
    );

    const days = Math.floor(diffSeconds / (60 * 60 * 24));
    diffSeconds %= 60 * 60 * 24;
    const hours = Math.floor(diffSeconds / (60 * 60));
    diffSeconds %= 60 * 60;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;

    ddayEl.innerHTML = `
      <div class="dday-grid">
        <div class="dday-item">
          <span class="card">${days}</span>
          <div class="desc">Day</div>
        </div>
        <div class="dday-item">
          <span class="card">${String(hours).padStart(2, "0")}</span>
          <div class="desc">Hour</div>
        </div>
        <div class="dday-item">
          <span class="card">${String(minutes).padStart(2, "0")}</span>
          <div class="desc">Min</div>
        </div>
        <div class="dday-item">
          <span class="card">${String(seconds).padStart(2, "0")}</span>
          <div class="desc">Sec</div>
        </div>
      </div>
    `;
  };

  update();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(update, 1000);
}

function renderCalendar(year, month, selectedDay) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  dayNames.forEach((day) => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;
    grid.appendChild(header);
  });

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell empty";
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "day-cell";
    dayCell.textContent = day;
    if (day === selectedDay) dayCell.classList.add("selected");
    grid.appendChild(dayCell);
  }
}

generateCalendar();

function initNoticeTabs() {
  const tabs = document.querySelectorAll("#noticeTabs .notice-tab-btn");
  const content = document.querySelector("#noticeContent .notice-content-text");

  if (!tabs.length || !content) return;

  const setActiveTab = (index) => {
    tabs.forEach((tab, i) => {
      tab.classList.toggle("active", i === index);
      tab.setAttribute("aria-selected", i === index ? "true" : "false");
    });

    content.textContent =
      NOTICE_TAB_CONTENTS[index] ?? NOTICE_TAB_CONTENTS[0] ?? "";
  };

  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", tab.classList.contains("active"));
    tab.onclick = () => setActiveTab(index);
  });

  const initialIndex = [...tabs].findIndex((tab) =>
    tab.classList.contains("active"),
  );
  setActiveTab(initialIndex >= 0 ? initialIndex : 0);
}

function preventImageSaveActions() {
  const protectImage = (img) => {
    img.draggable = false;
    img.setAttribute("draggable", "false");
    img.setAttribute("oncontextmenu", "return false;");
    img.style.webkitTouchCallout = "none";
    img.style.webkitUserSelect = "none";
    img.style.userSelect = "none";
  };

  document.querySelectorAll("img").forEach(protectImage);

  document.addEventListener("contextmenu", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node instanceof HTMLImageElement) {
          protectImage(node);
          return;
        }

        node.querySelectorAll?.("img").forEach(protectImage);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// 네이버 지도 초기화
function initMap() {
  if (typeof naver === "undefined") return;

  const { LAT, LNG, PLACE } = WEDDING_DATA.WEDDING;
  const { MAP } = WEDDING_DATA.IMAGES;
  const center = new naver.maps.LatLng(LAT, LNG);

  const map = new naver.maps.Map("map", {
    center,
    zoom: 17,
    zoomControl: false,
    draggable: false,
    scrollWheel: false,
    disableDoubleClickZoom: true,
    pinchZoom: false,
    keyboardShortcuts: false,
  });

  const marker = new naver.maps.Marker({
    position: center,
    map,
    title: PLACE,
    icon: {
      url: MAP,
      size: new naver.maps.Size(27, 36),
      scaledSize: new naver.maps.Size(27, 36),
      origin: new naver.maps.Point(0, 0),
      anchor: new naver.maps.Point(13.5, 36),
    },
  });
}

// 비디오
function playVideo() {
  const videoSection = document.getElementById("videoSection");
  const youtubeId = WEDDING_DATA.IMAGES.YOUTUBE_ID;

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  iframe.width = "100%";
  iframe.height = "100%";
  iframe.style.aspectRatio = "16 / 9";
  iframe.style.border = "none";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;

  // 기존 썸네일 제거
  videoSection.innerHTML = "";
  videoSection.appendChild(iframe);
}

// 갤러리
const images = [...WEDDING_DATA.GALLERY];
const PREVIEW_LIMIT = 9;

let currentIndex = 0;

const modal = document.getElementById("lightboxModal");
const mainImage = document.getElementById("lightboxImage");
const counter = document.getElementById("lightboxCounter");
const thumbnails = document.getElementById("lightboxThumbnails");
const loading = document.getElementById("lightboxLoading");
const galleryPreview = document.getElementById("galleryPreview");
const galleryMoreBtn = document.getElementById("galleryMoreBtn");

function initGalleryPreview() {
  galleryPreview.innerHTML = "";

  images.slice(0, PREVIEW_LIMIT).forEach((src, index) => {
    const div = document.createElement("div");
    div.classList = "gallery-thumb";
    div.onclick = () => openLightbox(index);

    const img = document.createElement("img");
    img.src = src;
    img.alt = `이미지 ${index + 1}`;

    div.appendChild(img);
    galleryPreview.appendChild(div);
  });

  if (!galleryMoreBtn) return;

  if (images.length > PREVIEW_LIMIT) {
    galleryMoreBtn.style.display = "flex";
    galleryMoreBtn.onclick = () => openLightbox(PREVIEW_LIMIT);
  } else {
    galleryMoreBtn.style.display = "none";
  }
}

function initThumbnails() {
  thumbnails.innerHTML = "";
  images.forEach((src, index) => {
    const item = document.createElement("div");
    item.className = "thumbnail-item";
    if (index === currentIndex) item.classList.add("active");

    const img = document.createElement("img");
    img.src = src;
    img.alt = `썸네일 ${index + 1}`;

    const number = document.createElement("div");
    number.className = "thumbnail-number";
    number.textContent = index + 1;

    item.appendChild(img);
    item.appendChild(number);
    item.onclick = () => goToImage(index);

    thumbnails.appendChild(item);
  });
}

function openLightbox(index) {
  currentIndex = index;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  loadImage(index);
  initThumbnails();
  scrollToActiveThumbnail();
}

function closeLightbox() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function loadImage(index) {
  loading.classList.add("active");
  mainImage.style.opacity = "0";

  const img = new Image();
  img.onload = () => {
    mainImage.src = images[index];
    mainImage.style.opacity = "1";
    loading.classList.remove("active");
    updateCounter();
    updateThumbnails();
    scrollToActiveThumbnail();
  };

  console.log(images[index]);
  img.src = images[index];
}

function updateCounter() {
  counter.textContent = `${currentIndex + 1} / ${images.length}`;
}

function updateThumbnails() {
  const items = thumbnails.querySelectorAll(".thumbnail-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentIndex);
  });
}

function scrollToActiveThumbnail() {
  const activeThumb = thumbnails.querySelector(".thumbnail-item.active");
  if (activeThumb) {
    const scrollLeft =
      activeThumb.offsetLeft -
      thumbnails.clientWidth / 2 +
      activeThumb.clientWidth / 2;
    thumbnails.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }
}

function goToImage(index) {
  currentIndex = index;
  loadImage(index);
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  loadImage(currentIndex);
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  loadImage(currentIndex);
}

document.getElementById("lightboxClose").onclick = closeLightbox;
document.getElementById("lightboxPrev").onclick = prevImage;
document.getElementById("lightboxNext").onclick = nextImage;

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("active")) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeLightbox();
});

let touchStartX = 0;
let touchEndX = 0;

modal.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
  },
  { passive: true },
);

modal.addEventListener(
  "touchend",
  (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  },
  { passive: true },
);

function handleSwipe() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) nextImage();
  if (touchEndX > touchStartX + swipeThreshold) prevImage();
}

initGalleryPreview();

// 계좌번호
function renderAccounts() {
  const container = document.getElementById("accountSection");
  if (!container) return;

  const { GROOM, BRIDE } = WEDDING_DATA.ACCOUNTS;

  container.innerHTML = "";

  container.appendChild(createAccountGroup("🤵🏻‍♂️신랑측 계좌번호", GROOM));
  container.appendChild(createAccountGroup("👰🏻‍♀️신부측 계좌번호", BRIDE));
}

function createAccountGroup(titleText, accounts) {
  const group = document.createElement("div");
  group.className = "account-group";

  const title = document.createElement("div");
  title.className = "title";
  const titleLabel = document.createElement("span");
  titleLabel.textContent = titleText;

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrow.setAttribute("width", "24");
  arrow.setAttribute("height", "24");
  arrow.setAttribute("viewBox", "0 0 24 24");
  arrow.setAttribute("fill", "none");
  arrow.setAttribute("stroke-width", "1.5");
  arrow.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  arrow.setAttribute("color", "#000000");
  arrow.classList.add("account-title-arrow");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M6 9L12 15L18 9");
  path.setAttribute("stroke", "#000000");
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  arrow.appendChild(path);

  title.appendChild(titleLabel);
  title.appendChild(arrow);

  const content = document.createElement("div");
  content.className = "account-content";
  content.style.display = "none";

  title.onclick = () => {
    const isOpen = content.style.display === "block";
    content.style.display = isOpen ? "none" : "block";
    group.classList.toggle("open", !isOpen);
  };

  group.appendChild(title);
  group.appendChild(content);

  accounts.forEach(({ BANK, NUMBER, RELATE, NAME, KAKAO }) => {
    const row = document.createElement("div");
    row.className = "account-row";

    const info = document.createElement("div");
    info.className = "account-info";

    const bank = document.createElement("div");
    bank.className = "account-bank";
    bank.textContent = `${BANK} ${NUMBER}`;

    const holder = document.createElement("div");
    holder.className = "account-holder";

    if (RELATE) {
      const relate = document.createElement("span");
      relate.className = "account-relate";
      relate.textContent = RELATE;
      holder.appendChild(relate);
    }

    holder.appendChild(document.createTextNode(NAME));

    info.appendChild(bank);
    info.appendChild(holder);

    const btnWrap = document.createElement("div");
    btnWrap.className = "account-btn";

    if (KAKAO) {
      const kakaoBtn = document.createElement("button");
      kakaoBtn.className = "account-kakao";
      kakaoBtn.textContent = "카카오페이 송금";
      kakaoBtn.onclick = () => {
        window.location.href = KAKAO;
      };
      btnWrap.appendChild(kakaoBtn);
    }

    const copyBtn = document.createElement("button");
    copyBtn.className = "account-copy";
    copyBtn.textContent = "계좌번호 복사";
    copyBtn.onclick = () => copyAccount(`${BANK} ${NUMBER}`);

    btnWrap.appendChild(copyBtn);

    row.appendChild(info);
    row.appendChild(btnWrap);

    content.appendChild(row);
  });

  return group;
}

renderAccounts();

// 카카오 공유하기
Kakao.init("46335dc2294ed249a2a77b5041b5e248");
function shareKakao() {
  Kakao.Share.createDefaultButton({
    container: "#kakaoShare",
    objectType: "feed",
    content: {
      title: "이승현과 진가영 결혼합니다.🤵🏻‍♂️👰🏻‍♀️",
      description: "예식일 : 05월 09일 토요일 오전 11시00분",
      imageUrl:
        "https://lh3.googleusercontent.com/d/1j0E_Wm13LrMmPUb1QYdRyQl10AG36CxD",
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
    },
    buttons: [
      {
        title: "자세히보기",
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
    ],
  });
}

// 복사하기
function copyUrl() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => alert("청첩장 주소가 복사되었습니다."));
}

function copyAddress() {
  navigator.clipboard
    .writeText(WEDDING_DATA.WEDDING.ADDRESS)
    .then(() => alert("주소가 복사되었습니다."));
}

function openMapLink(appUrl, webUrl) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    window.open(webUrl, "_blank");
    return;
  }

  const start = Date.now();
  window.location.href = appUrl;

  setTimeout(() => {
    if (Date.now() - start < 1800) {
      window.open(webUrl, "_blank");
    }
  }, 1200);
}

function openNaverMap() {
  const { LAT, LNG } = WEDDING_DATA.WEDDING;
  const placeKeyword = "더채플앳대치";
  const appName = encodeURIComponent(window.location.hostname || "wedding");
  const placeName = encodeURIComponent(placeKeyword);

  const appUrl = `nmap://route/public?dlat=${LAT}&dlng=${LNG}&dname=${placeName}&appname=${appName}`;
  const webUrl = `https://map.naver.com/v5/search/${placeName}`;
  openMapLink(appUrl, webUrl);
}

function openKakaoNavi() {
  const { PLACE, LAT, LNG } = WEDDING_DATA.WEDDING;
  const placeName = encodeURIComponent(PLACE);

  const appUrl = `kakaonavi://navigate?name=${placeName}&x=${LNG}&y=${LAT}&coord_type=wgs84`;
  const webUrl = `https://map.kakao.com/link/to/${placeName},${LAT},${LNG}`;
  openMapLink(appUrl, webUrl);
}

function openTmap() {
  const { LAT, LNG } = WEDDING_DATA.WEDDING;
  const placeKeyword = "더채플앳대치";
  const placeName = encodeURIComponent(placeKeyword);

  const appUrl = `tmap://route?goalx=${LNG}&goaly=${LAT}&goalname=${placeName}`;
  const webUrl = `https://map.naver.com/v5/search/${placeName}`;
  openMapLink(appUrl, webUrl);
}

function copyAccount(account) {
  navigator.clipboard
    .writeText(account)
    .then(() => alert("계좌번호가 복사되었습니다."));
}

// bgm 재생하기
function updateBgmButton(isPlaying) {
  const playIcon = document.querySelector(".bgm-icon-play");
  const stopIcon = document.querySelector(".bgm-icon-stop");

  if (!playIcon || !stopIcon) return;

  playIcon.classList.toggle("is-hidden", !isPlaying);
  stopIcon.classList.toggle("is-hidden", isPlaying);
}

function initBgm() {
  const audio = document.getElementById("bgm");
  if (!audio?.src) return;

  audio.addEventListener("play", () => updateBgmButton(true));
  audio.addEventListener("pause", () => updateBgmButton(false));
  audio.addEventListener("ended", () => updateBgmButton(false));

  // 처음 로드 시 재생 시도
  audio
    .play()
    .then(() => updateBgmButton(true))
    .catch(() => updateBgmButton(false));
}

function playAudio() {
  const audio = document.getElementById("bgm");

  if (!audio.src) {
    console.warn("BGM src가 아직 없습니다");
    return;
  }

  if (audio.paused) {
    audio.play().catch((err) => {
      console.error("재생 실패:", err);
    });
  } else {
    audio.pause();
  }
}

//설문조사 링크
function openRSVP() {
  window.open(WEDDING_DATA.WEDDING.RSVP, "_blank");
}
