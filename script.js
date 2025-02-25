// DOM要素の取得
const startScanBtn = document.getElementById('startScan'); // 「診断を開始」ボタン
const video = document.getElementById('video');            // カメラ映像用のvideo要素
const captureBtn = document.getElementById('capture');       // 「撮影」ボタン
const analyzeBtn = document.getElementById('analyze');       // 「この写真で診断」ボタン
const canvas = document.getElementById('canvas');            // 撮影結果用のcanvas
const preview = document.getElementById('preview');          // 撮影・参照画像のプレビュー用

// グローバル変数
let currentImageData = '';   // 撮影または参照した画像データを保持
let currentResult = "";      // AI診断の結果を保持
let mode = "";               // "capture"（撮影）または "file"（画像参照）を記録

// ★ 画像参照用のファイル入力要素（初期状態は非表示）
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// ★ 「再撮影する」ボタン（撮影モード用、初期非表示）
const reCaptureBtn = document.createElement('button');
reCaptureBtn.textContent = "再撮影する";
reCaptureBtn.style.display = "none";
document.body.appendChild(reCaptureBtn);

// ★ 「画像を選びなおす」ボタン（画像参照モード用、初期非表示）
const selectAgainBtn = document.createElement('button');
selectAgainBtn.textContent = "画像を選びなおす";
selectAgainBtn.style.display = "none";
document.body.appendChild(selectAgainBtn);

// ★ 「写真を撮影する」ボタン（画像参照モード用、切り替え用、初期非表示）
const takePhotoBtn = document.createElement('button');
takePhotoBtn.textContent = "写真を撮影する";
takePhotoBtn.style.display = "none";
document.body.appendChild(takePhotoBtn);

// ★ 「もう一回診断する」ボタン（診断結果後用、初期非表示）
const retryBtn = document.createElement('button');
retryBtn.textContent = "もう一回診断する";
retryBtn.style.display = "none";
document.body.appendChild(retryBtn);

// ★ シェアボタン関連（初期状態は非表示）
const shareBtn = document.createElement('button');
shareBtn.textContent = '診断結果を画像で保存';
shareBtn.style.display = "none";
document.body.appendChild(shareBtn);

const twitterBtn = document.createElement('button');
twitterBtn.textContent = 'Twitterでシェア';
twitterBtn.style.display = "none";
document.body.appendChild(twitterBtn);

const lineBtn = document.createElement('button');
lineBtn.textContent = 'LINEでシェア';
lineBtn.style.display = "none";
document.body.appendChild(lineBtn);

/* 
  --- 動作フロー ---
  1. 初期状態: 「診断を開始」ボタンのみ表示
  2. 「診断を開始」を押すと、カメラ起動し、video, 撮影ボタン, 画像参照(fileInput)が表示される
  3. 撮影ボタンを押すと、画像がキャプチャされ、mode = "capture" となり、プレビュー表示＋「この写真で診断」ボタンと「再撮影する」ボタンが表示される
  4. ファイル選択の場合、mode = "file" となり、プレビュー表示＋「この写真で診断」ボタン、さらに「画像を選びなおす」と「写真を撮影する」ボタンが表示される
  5. 「この写真で診断」を押すと、診断結果が取得され、結果を画像化してプレビューに表示。さらに、シェアボタン群と「もう一回診断する」ボタンが表示される
  6. 「再撮影する」/「画像を選びなおす」/「写真を撮影する」ボタンで、それぞれ撮影モードまたは画像参照モードに戻る
  7. 「もう一回診断する」ボタンで初期状態にリセット
*/

// 【状態リセット関数】 初期状態に戻す
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
  lineBtn.style.display = "none";
  preview.style.display = "none";
  currentImageData = "";
  currentResult = "";
  mode = "";
}

// 初期状態にリセット
resetToInitial();

// 【診断を開始】ボタン: カメラ起動とUI切り替え
startScanBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.style.display = "block";              // カメラ映像を表示
    captureBtn.style.display = "inline-block";    // 撮影ボタン表示
    fileInput.style.display = "inline-block";     // 画像参照ボタン表示
    startScanBtn.style.display = "none";          // 診断開始ボタンは非表示
    await video.play();
  } catch (err) {
    alert("カメラのアクセスが許可されていません。設定を確認してください。");
    console.error("カメラ起動エラー:", err);
  }
});

// 【撮影処理】 撮影ボタン押下でvideoからcanvasに画像をキャプチャ
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  currentImageData = canvas.toDataURL('image/jpeg', 0.7); // 画像データを保存
  preview.src = currentImageData;
  preview.style.display = "block";
  
  mode = "capture"; // 撮影モード
  // 撮影完了後、UIの切り替え：video, 撮影ボタン, ファイル入力を非表示し、「この写真で診断」ボタンと「再撮影する」ボタンを表示
  video.style.display = "none";
  captureBtn.style.display = "none";
  fileInput.style.display = "none";
  analyzeBtn.style.display = "block";  
  reCaptureBtn.style.display = "inline-block";
});

// 【ファイル選択処理】 ユーザーがファイルを選択した場合、画像をプレビューに表示
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentImageData = e.target.result;
      preview.src = currentImageData;
      preview.style.display = "block";
      
      mode = "file"; // 画像参照モード
      // UIの切り替え：video, 撮影ボタン, ファイル入力を非表示し、「この写真で診断」ボタン、
      // 「画像を選びなおす」ボタンと「写真を撮影する」ボタンを表示
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

// 【診断処理】 「この写真で診断」ボタンが押されたら、画像データをバックエンドに送信して診断結果を取得
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
    currentResult = result.result;  // 診断結果を保存
    displayResultImage(currentResult); // 診断結果を画像化してプレビューに表示
    analyzeBtn.style.display = "none";  // 「この写真で診断」ボタン非表示
    // 診断結果取得後、シェアボタン群と「もう一回診断する」ボタンを表示
    shareBtn.style.display = "block";
    twitterBtn.style.display = "inline-block";
    lineBtn.style.display = "inline-block";
    retryBtn.style.display = "block";
    // 「再撮影する」ボタンは非表示
    reCaptureBtn.style.display = "none";
    // ファイル選択モードの場合、ここで「画像を選びなおす」と「写真を撮影する」ボタンは非表示
    selectAgainBtn.style.display = "none";
    takePhotoBtn.style.display = "none";
  })
  .catch(error => {
    console.error('エラー発生:', error);
    alert("診断に失敗しました。");
  });
});

// 【診断結果の画像化機能】 診断結果のテキストをCanvasに描画し、画像化してプレビューに表示
function displayResultImage(resultText) {
  const resultCanvas = document.createElement('canvas');
  const ctx = resultCanvas.getContext('2d');
  
  resultCanvas.width = 500;
  resultCanvas.height = 300;
  
  ctx.fillStyle = "#f9f9f9";  // 背景描画
  ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
  ctx.fillStyle = "#333";     // テキストスタイル設定
  ctx.font = "20px Arial";
  ctx.fillText("【診断結果】", 20, 40);
  
  const lines = resultText.split("\n");
  let y = 80;
  lines.forEach(line => {
    ctx.fillText(line, 20, y);
    y += 30;
  });
  
  const resultImageData = resultCanvas.toDataURL('image/png');
  preview.src = resultImageData;
  preview.style.display = "block";
}

// 【画像を選びなおす】ボタン：ファイル参照モード用に再度ファイル入力を表示
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

// 【写真を撮影する】ボタン：ファイル参照モードから撮影モードに切り替える
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

// 【再撮影する】ボタン：撮影モード用にカメラ状態に戻す
reCaptureBtn.addEventListener('click', () => {
  // 完全に以前の撮影結果をクリア
  currentImageData = "";
  currentResult = "";
  preview.src = "";
  preview.style.display = "none";
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // UIを撮影モードにリセット：videoと撮影ボタンを表示
  video.style.display = "block";
  captureBtn.style.display = "inline-block";
  analyzeBtn.style.display = "none";
  reCaptureBtn.style.display = "none";
});

// 【もう一回診断する】ボタン：すべての状態を初期にリセットする
retryBtn.addEventListener('click', () => {
  resetToInitial();
});
