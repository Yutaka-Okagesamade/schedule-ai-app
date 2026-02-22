document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startActions = document.getElementById('start-actions');
    const cameraContainer = document.getElementById('camera-container');
    const previewContainer = document.getElementById('preview-container');
    const statusArea = document.getElementById('status-area');
    const resultArea = document.getElementById('result-area');

    const startCameraBtn = document.getElementById('start-camera-btn');
    const fileInput = document.getElementById('file-input');

    const cameraVideo = document.getElementById('camera-video');
    const captureBtn = document.getElementById('capture-btn');
    const cancelCameraBtn = document.getElementById('cancel-camera-btn');

    const photoCanvas = document.getElementById('photo-canvas');
    const photoPreview = document.getElementById('photo-preview');
    const retakeBtn = document.getElementById('retake-btn');
    const sendGasBtn = document.getElementById('send-gas-btn');

    const homeBtn = document.getElementById('home-btn');

    let stream = null;
    let currentBase64Image = '';

    // --- View Management ---
    function showView(viewElement) {
        document.querySelectorAll('.state-view').forEach(el => el.classList.remove('active'));
        viewElement.classList.add('active');
    }

    // --- Camera Functions ---
    async function startCamera() {
        try {
            // Requirements: rear camera preferred, exact constraints are sometimes tricky on desktop vs mobile
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer rear camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraVideo.srcObject = stream;
            showView(cameraContainer);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('カメラの起動に失敗しました。権限が許可されているか、カメラが接続されているか確認してください。\nまたは、「画像ファイルを選択」を使用してください。');
            stopCamera();
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraVideo.srcObject = null;
    }

    function capturePhoto() {
        const context = photoCanvas.getContext('2d');
        // Set canvas dimensions to match video dimensions
        photoCanvas.width = cameraVideo.videoWidth;
        photoCanvas.height = cameraVideo.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(cameraVideo, 0, 0, photoCanvas.width, photoCanvas.height);

        // Convert canvas to base64 image
        const dataUrl = photoCanvas.toDataURL('image/jpeg', 0.8); // 0.8 quality handles size well
        photoPreview.src = dataUrl;
        currentBase64Image = dataUrl.split(',')[1];

        stopCamera();
        showView(previewContainer);
    }

    // --- File Upload Function ---
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            photoPreview.src = e.target.result;
            currentBase64Image = e.target.result.split(',')[1];
            showView(previewContainer);
        };
        reader.readAsDataURL(file);

        // Reset file input so same file can be selected again if needed
        event.target.value = '';
    }

    // --- GAS Submission ---
    async function sendToGAS() {
        showView(statusArea);

        // ★ここにGASでデプロイした「ウェブアプリのURL」を貼り付けます
        const gasUrl = 'https://script.google.com/macros/s/AKfycby63mWx4ZJ7pLMF-DJ33bktRyDVNd23GfQug0JGApRH1uS_lxMH3_xNlGa8bIKGVYouQg/exec';

        if (!gasUrl || gasUrl.includes('YOUR_GAS_WEB_APP_URL')) {
            alert('【開発者への注意】\nGASのウェブアプリURLが設定されていません。\napp.jsの gasUrl を書き換えてから再度お試しください。');
            showView(previewContainer);
            return;
        }

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                body: JSON.stringify({
                    image: currentBase64Image,
                    mimeType: 'image/jpeg'
                })
            });
            const result = await response.json();

            if (result.success) {
                showView(resultArea);
            } else {
                alert('エラーが発生しました: ' + result.error);
                showView(previewContainer);
            }
        } catch (error) {
            console.error('通信エラー:', error);
            alert('通信エラーが発生しました。ネットワーク接続やGASのURLを確認してください。');
            showView(previewContainer);
        }
    }

    // --- Event Listeners ---
    startCameraBtn.addEventListener('click', startCamera);
    cancelCameraBtn.addEventListener('click', () => {
        stopCamera();
        showView(startActions);
    });

    captureBtn.addEventListener('click', capturePhoto);

    fileInput.addEventListener('change', handleFileUpload);

    retakeBtn.addEventListener('click', () => {
        currentBase64Image = '';
        showView(startActions);
    });

    sendGasBtn.addEventListener('click', sendToGAS);

    homeBtn.addEventListener('click', () => {
        currentBase64Image = '';
        showView(startActions);
    });

});







