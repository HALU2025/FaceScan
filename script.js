// ===================== 1. 初期設定と DOM 要素の取得 =====================
const startScanBtn = document.getElementById('startScan'); // 「診断を開始」ボタン
const video = document.getElementById('video');            // カメラ映像用の video 要素
const captureBtn = document.getElementById('capture');       // 「撮影」ボタン
const analyzeBtn = document.getElementById('analyze');       // 「この写真で診断」ボタン
const canvas = document.getElementById('canvas');            // 撮影結果用の canvas
const preview = document.getElementById('preview');          // プレビュー画像

// グローバル変数
let currentImageData = "";   // 撮影または選択した画像データ
let currentResult = "";      // AI診断結果のテキスト（HTML形式の文字列）
let mode = "";               // 状態: "capture"（撮影）または "file"（画像参照）など

// 動的に生成する追加UI要素（初期状態は非表示）
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

const reCaptureBtn = document.createElement('button');
reCaptureBtn.textContent = "再撮影する";
reCaptureBtn.style.display = "none";
document.body.appendChild(reCaptureBtn);

const selectAgainBtn = document.createElement('button');
selectAgainBtn.textContent = "画像を選びなおす";
selectAgainBtn.style.display = "none";
document.body.appendChild(selectAgainBtn);

const takePhotoBtn = document.createElement('button');
takePhotoBtn.textContent = "写真を撮影する";
takePhotoBtn.style.display = "none";
document.body.appendChild(takePhotoBtn);

const retryBtn = document.createElement('button');
retryBtn.textContent = "もう一回診断する";
retryBtn.style.display = "none";
document.body.appendChild(retryBtn);

const shareBtn = document.createElement('button');
shareBtn.textContent = "診断結果を画像で保存";
shareBtn.style.display = "none";
document.body.appendChild(shareBtn);

const twitterBtn = document.createElement('button');
twitterBtn.textContent = "Xでシェア";
twitterBtn.style.display = "none";
document.body.appendChild(twitterBtn);

const fbBtn = document.createElement('button');
fbBtn.textContent = "Facebookでシェア";
fbBtn.style.display = "none";
document.body.appendChild(fbBtn);

const instaBtn = document.createElement('button');
instaBtn.textContent = "Instagramでシェア";
instaBtn.style.display = "none";
document.body.appendChild(instaBtn);

// ===================== 2. ユーティリティ関数と状態リセット =====================
function resetToInitial() {
  startScanBtn.style.display = "block";
  video.style.display = "none";
  captureBtn.style.display = "none";
  fileInput.style.display = "none";
  analyzeBtn.style.display = "none";
  reCaptureBtn.style.display = "none";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  retryBtn.style.display = "none";
  shareBtn.style.display = "none";
  twitterBtn.style.display = "none";
  fbBtn.style.display = "none";
  instaBtn.style.display = "none";
  preview.style.display = "none";
  currentImageData = "";
  currentResult = "";
  mode = "";
}
resetToInitial();

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

// ===================== 3. カメラ起動・ファイル選択の処理 =====================
// 3-1. 診断開始（カメラ起動）処理
startScanBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.style.display = "block";              // カメラ映像表示
    captureBtn.style.display = "inline-block";    // 撮影ボタン表示
    fileInput.style.display = "inline-block";     // 画像参照ボタン表示
    startScanBtn.style.display = "none";          // 診断開始ボタン非表示
    await video.play();
  } catch (err) {
    alert("カメラのアクセスが許可されていません。設定を確認してください。");
    console.error("カメラ起動エラー:", err);
  }
});

// 3-2. 撮影処理（カメラ映像から画像キャプチャ）
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  currentImageData = canvas.toDataURL('image/jpeg', 0.7);
  preview.src = currentImageData;
  preview.style.display = "block";
  
  mode = "capture"; // 撮影モード
  video.style.display = "none";
  captureBtn.style.display = "none";
  fileInput.style.display = "none";
  analyzeBtn.style.display = "block";
  reCaptureBtn.style.display = "inline-block";
});

// 3-3. ファイル選択処理（画像参照）
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentImageData = e.target.result;
      preview.src = currentImageData;
      preview.style.display = "block";
      
      mode = "file"; // 画像参照モード
      video.style.display = "none";
      captureBtn.style.display = "none";
      fileInput.style.display = "none";
      analyzeBtn.style.display = "block";
      selectAgainBtn.style.display = "inline-block";
      takePhotoBtn.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  }
});

// ===================== 4. 診断実行（API 呼び出し） =====================
analyzeBtn.addEventListener('click', () => {
  if (!currentImageData) {
    alert("画像を撮影または参照してください！");
    return;
  }
  fetch('https://facescan-api.onrender.com/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: currentImageData })
  })
  .then(response => response.json())
  .then(result => {
    console.log('サーバーからのレスポンス:', result);
    currentResult = result.result;  // 診断結果（HTML形式の文字列）を保存
    // 4-1. 診断結果をHTMLとして表示する
    displayResultHTML(currentResult);
    analyzeBtn.style.display = "none";  // 「この写真で診断」ボタン非表示
    // 結果取得後、再操作ボタン群を表示
    retryBtn.style.display = "block";
    reCaptureBtn.style.display = "none";
    selectAgainBtn.style.display = "none";
    takePhotoBtn.style.display = "none";
    
    mode = "result";
    updateShareUI();  // シェア用UIの更新（モバイル/PCで分岐）
  })
  .catch(error => {
    console.error('エラー発生:', error);
    alert("診断に失敗しました。");
  });
});

// ===================== 5. 診断結果のHTML表示（テキスト→HTML変換） =====================

// 5-1. AIから返されたプレーンテキストを、各行ごとに適切なタグでラッピングしてHTML文字列を生成する関数
function transformResultToHTML(resultText) {
    // 改行で分割し、空行や区切り線（----------------------------）は除外
    const lines = resultText.split("\n").filter(line => {
      const trimmed = line.trim();
      return trimmed !== "" && !trimmed.includes('----------------------------');
    });
    
    let html = "<div class='result'>";
    
    // 5-2. キャッチフレーズ
    if (lines.length >= 1 && lines[0].includes("キャッチフレーズ:")) {
      html += "<div class='catchphrase'>" + lines[0] + "</div>";
    }
    
    // 5-3. 美人度/イケメン度
    if (lines.length >= 2 && lines[1].includes("美人度:")) {
      html += "<div class='main-score'>" + lines[1] + "</div>";
    }
    
    // 5-4. 推定年齢
    if (lines.length >= 3 && lines[2].includes("推定年齢:")) {
      html += "<div class='age'>" + lines[2] + "</div>";
    }
    
    // 5-5. 評価軸（次の3行をそれぞれ score1, score2, score3 としてラッピング）
    if (lines.length >= 6) {
      html += "<div class='score1'>" + lines[3] + "</div>";
      html += "<div class='score2'>" + lines[4] + "</div>";
      html += "<div class='score3'>" + lines[5] + "</div>";
    }
    
    // 5-6. 似ている芸能人（"似ている芸能人" が含まれる行と、その後の "-" で始まる各行）
    const celebHeaderIndex = lines.findIndex(line => line.includes("似ている芸能人"));
    if (celebHeaderIndex !== -1) {
      html += "<div class='celeb-header'>" + lines[celebHeaderIndex] + "</div>";
      // 複数行ある場合、次の行から "-" で始まる行を個別に追加
      for (let i = celebHeaderIndex + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith("-")) {
          html += "<div class='celeb'>" + lines[i] + "</div>";
        } else {
          break;
        }
      }
    }
    
    // 5-7. コメント（"コメント:" で始まる行）
    const commentIndex = lines.findIndex(line => line.startsWith("コメント:"));
    if (commentIndex !== -1) {
      html += "<div class='comment'>" + lines[commentIndex] + "</div>";
    }
    
    // 5-8. フッタ（"※" で始まる行）
    const footnoteIndex = lines.findIndex(line => line.startsWith("※"));
    if (footnoteIndex !== -1) {
      html += "<div class='footnote'>" + lines[footnoteIndex] + "</div>";
    }
    
    html += "</div>";
    return html;
  }
  
  // 5-9. 診断結果をHTML形式で表示する関数
  function displayResultHTML(resultText) {
    let resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) {
      resultContainer = document.createElement('div');
      resultContainer.id = 'resultContainer';
      resultContainer.style.marginTop = "20px";
      resultContainer.style.padding = "20px";
      resultContainer.style.backgroundColor = "#fff";
      resultContainer.style.border = "1px solid #ccc";
      resultContainer.style.borderRadius = "8px";
      const container = document.querySelector('.container');
      container.appendChild(resultContainer);
    }
    // transformResultToHTML を呼び出して、HTML文字列を resultContainer にセット
    resultContainer.innerHTML = transformResultToHTML(resultText);
    // 結果表示後、プレビューは不要なら非表示
    preview.style.display = "none";
  }
  

// ===================== 6. 各種再操作ボタンの処理 =====================
// 6-1. 再撮影するボタン（撮影モード用）
reCaptureBtn.addEventListener('click', () => {
  currentImageData = "";
  currentResult = "";
  preview.src = "";
  preview.style.display = "none";
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  video.style.display = "block";
  captureBtn.style.display = "inline-block";
  analyzeBtn.style.display = "none";
  reCaptureBtn.style.display = "none";
});

// 6-2. 画像を選びなおすボタン（画像参照モード用）
selectAgainBtn.addEventListener('click', () => {
  fileInput.style.display = "inline-block";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  analyzeBtn.style.display = "none";
  preview.src = "";
  preview.style.display = "none";
  currentImageData = "";
  mode = "file";
});

// 6-3. 写真を撮影するボタン（画像参照モードから撮影モードへの切り替え）
takePhotoBtn.addEventListener('click', () => {
  video.style.display = "block";
  captureBtn.style.display = "inline-block";
  fileInput.style.display = "none";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  analyzeBtn.style.display = "none";
  preview.src = "";
  preview.style.display = "none";
  currentImageData = "";
  mode = "capture";
});

// 6-4. もう一回診断するボタン（全体リセット）
retryBtn.addEventListener('click', () => {
  resetToInitial();
});

// ===================== 7. シェア/保存用UIの更新（モバイル/PC分岐） =====================
function updateShareUI() {
  const container = document.querySelector('.container');
  
  if (mode === 'result') {
    if (isMobile()) {
      // ① モバイルの場合：診断結果画面に「画像を長押しで保存」という案内テキストを表示
      let mobileMsg = document.getElementById('mobileSaveMsg');
      if (!mobileMsg) {
        mobileMsg = document.createElement('p');
        mobileMsg.id = 'mobileSaveMsg';
        // ① テキストを「画像を長押しで保存」に設定
        mobileMsg.textContent = "画像を長押しで保存";
        mobileMsg.style.fontSize = "16px";
        mobileMsg.style.color = "#333";
        mobileMsg.style.textAlign = "center";
        mobileMsg.style.marginTop = "20px";
        container.appendChild(mobileMsg);
      }
      // モバイルでは PC用のシェアボタン群を表示するか非表示にするか、今回は両方表示も可能です
      // ここでは一旦非表示としています（必要に応じてコメントアウトしてください）
      // shareBtn.style.display = "none";
      // twitterBtn.style.display = "none";
      // fbBtn.style.display = "none";
      // instaBtn.style.display = "none";
    } else {
      // ② PCの場合：シェアボタン群を表示
      // 既にモバイル用の案内テキストがあれば削除
      const mobileMsg = document.getElementById('mobileSaveMsg');
      if (mobileMsg) mobileMsg.remove();
      
      shareBtn.style.display = "block";
      twitterBtn.style.display = "inline-block";
      fbBtn.style.display = "inline-block";
      instaBtn.style.display = "inline-block";
    }
  }
}

// ===================== 8. シェア/保存ボタンのイベント（PC専用、HTML→画像変換） =====================
if (!isMobile()) {
    shareBtn.addEventListener('click', () => {
      // ① 結果表示用のHTMLコンテナを取得（displayResultHTML()で生成していると仮定）
      const resultContainer = document.getElementById('resultContainer');
      if (!resultContainer) {
        alert("診断結果表示エリアが見つかりません。");
        return;
      }
      
      // ② html2canvas を使って、結果表示コンテナをキャンバスに変換
      html2canvas(resultContainer).then((canvas) => {
        // ③ キャンバスをPNG画像に変換
        const dataUrl = canvas.toDataURL('image/png');
        
        // ④ ダウンロードリンクを生成し自動クリックで画像をダウンロード
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = "face_scan_result.png";
        a.click();
      }).catch((err) => {
        console.error("html2canvasエラー:", err);
        alert("画像の生成に失敗しました。");
      });
    });
    
    // Twitter/Xでシェアボタンのイベント
    twitterBtn.addEventListener('click', () => {
      const text = encodeURIComponent("【診断結果】 Check out my FaceScan result!");
      const url = encodeURIComponent(window.location.href);
      const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      window.open(shareUrl, '_blank');
    });
    
    // Facebookでシェアボタンのイベント
    fbBtn.addEventListener('click', () => {
      const url = encodeURIComponent(window.location.href);
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      window.open(shareUrl, '_blank');
    });
    
    // Instagramでシェアボタンのイベント（Instagramは直接のシェア不可なので案内）
    instaBtn.addEventListener('click', () => {
      alert("Instagramへの直接シェアはできません。画像を保存してInstagramアプリから投稿してください。");
    });
  }