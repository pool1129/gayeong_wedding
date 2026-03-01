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

  initMap();
});

// 결혼식 날짜 설정
const WEDDING_DATE = WEDDING_DATA.WEDDING.DATE;
const WEDDING_TIME = WEDDING_DATA.WEDDING.TIME;

// 달력 생성
const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

let currentIndex = 0;

const modal = document.getElementById("lightboxModal");
const mainImage = document.getElementById("lightboxImage");
const counter = document.getElementById("lightboxCounter");
const thumbnails = document.getElementById("lightboxThumbnails");
const loading = document.getElementById("lightboxLoading");
const galleryPreview = document.getElementById("galleryPreview");

function initGalleryPreview() {
  images.forEach((src, index) => {
    const div = document.createElement("div");
    div.classList = "gallery-thumb";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `이미지 ${index + 1}`;
    img.onclick = () => openLightbox(index);

    div.appendChild(img);
    galleryPreview.appendChild(div);
  });
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

function copyAccount(account) {
  navigator.clipboard
    .writeText(account)
    .then(() => alert("계좌번호가 복사되었습니다."));
}

// bgm 재생하기
let isPlaying = false;

function playAudio() {
  const audio = document.getElementById("bgm");
  const icon = document.getElementById("btn-icon");

  if (!audio.src) {
    console.warn("BGM src가 아직 없습니다");
    return;
  }

  if (audio.paused) {
    audio.play().catch((err) => {
      console.error("재생 실패:", err);
    });
    icon.src = WEDDING_DATA.BGM.STOP_IMAGE;
  } else {
    audio.pause();
    icon.src = WEDDING_DATA.BGM.PLAY_IMAGE;
  }
}

//설문조사 링크
function openRSVP() {
  window.open(WEDDING_DATA.WEDDING.RSVP, "_blank");
}
