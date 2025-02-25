// DOM要素の取得
const startScanBtn = document.getElementById('startScan'); // 「診断を開始」ボタン
const video = document.getElementById('video');            // カメラ映像用のvideo要素
const captureBtn = document.getElementById('capture');       // 「撮影」ボタン
const analyzeBtn = document.getElementById('analyze');       // 「この写真で診断」ボタン
const canvas = document.getElementById('canvas');            // 撮影結果用のcanvas
const preview = document.getElementById('preview');          // 撮影・参照画像のプレビュー用

let currentImageData = '';   // 撮影または参照した画像データを保持
let currentResult = "";      // AI診断の結果を保持

// ★ 画像参照用のファイル入力要素を動的に作成（復活）
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
// ページに追加（ここではbodyの末尾に追加）
document.body.appendChild(fileInput);

// 【診断を開始】ボタンが押されたらカメラを起動する
startScanBtn.addEventListener('click', async () => {
    try {
        // カメラの取得（インカメラ指定）
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.style.display = "block";      // カメラ映像を表示
        captureBtn.style.display = "block";   // 撮影ボタンを表示
        startScanBtn.style.display = "none";    // 診断開始ボタンは非表示に
        await video.play();                   // 映像の再生を開始
    } catch (err) {
        alert("カメラのアクセスが許可されていません。設定を確認してください。");
        console.error("カメラ起動エラー:", err);
    }
});

// 【撮影処理】: 撮影ボタンが押されると、videoからcanvasに画像を描画
captureBtn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // canvasの画像データをJPEG形式（70%画質）に変換して保存
    currentImageData = canvas.toDataURL('image/jpeg', 0.7);
    preview.src = currentImageData;
    preview.style.display = "block";

    // 撮影が完了したら、診断実行ボタンを表示し、撮影ボタンとカメラ映像は非表示に
    analyzeBtn.style.display = "block";
    captureBtn.style.display = "none";
    video.style.display = "none";
});

// 【ファイル選択処理】: 画像参照機能（ユーザーがファイルを選んだ場合）
// 選択した画像はプレビューに表示され、currentImageData に保存される
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result; // 選択した画像データを保存
            preview.src = currentImageData;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// 【診断処理】: 「この写真で診断」ボタンが押されたら、画像データをバックエンドに送信し、診断結果を取得する
analyzeBtn.addEventListener('click', () => {
    if (!currentImageData) {
        alert("画像を撮影または参照してください！");
        return;
    }
    // APIリクエスト（RenderにデプロイしたバックエンドのURL）
    fetch('https://facescan-api.onrender.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: currentImageData })
    })
    .then(response => response.json())
    .then(result => {
        console.log('サーバーからのレスポンス:', result);
        currentResult = result.result;  // 診断結果を保存
        // 診断結果を画像化して、プレビューに表示する
        displayResultImage(currentResult);
    })
    .catch(error => {
        console.error('エラー発生:', error);
        alert("診断に失敗しました。");
    });
});

// 【診断結果の画像化機能】
// 診断結果テキストをCanvasに描画し、画像データに変換して preview に表示
function displayResultImage(resultText) {
    const resultCanvas = document.createElement('canvas');
    const ctx = resultCanvas.getContext('2d');
  
    resultCanvas.width = 500;
    resultCanvas.height = 300;
  
    // 背景の描画
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
    // テキストのスタイル設定
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("【診断結果】", 20, 40);
  
    // 診断結果テキストを改行ごとに描画
    const lines = resultText.split("\n");
    let y = 80;
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += 30;
    });
  
    // Canvasから画像データを生成
    const resultImageData = resultCanvas.toDataURL('image/png');
  
    // プレビュー画像を診断結果の画像に置き換える
    preview.src = resultImageData;
    preview.style.display = "block";
}

// 【シェア機能の実装】
// TwitterとLINEのシェアボタンを動的に作成し、クリック時にシェアする
const twitterBtn = document.createElement('button');
twitterBtn.textContent = 'Twitterでシェア';
document.body.appendChild(twitterBtn);

const lineBtn = document.createElement('button');
lineBtn.textContent = 'LINEでシェア';
document.body.appendChild(lineBtn);

twitterBtn.addEventListener('click', () => {
    const text = encodeURIComponent("【診断結果】\nあなたの顔の診断結果が出ました！\n\n #FaceScan #診断アプリ");
    const url = encodeURIComponent(window.location.href);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank');
});

lineBtn.addEventListener('click', () => {
    const text = encodeURIComponent("【診断結果】\nあなたの顔の診断結果が出ました！\n\n #FaceScan #診断アプリ");
    const lineUrl = `https://line.me/R/msg/text/?${text}`;
    window.open(lineUrl, '_blank');
});
