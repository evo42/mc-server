document.addEventListener('DOMContentLoaded', function() {
    const copyButton = document.getElementById('copy-button');
    const serverAddress = document.getElementById('server-address');
    
    copyButton.addEventListener('click', function() {
        // Create a temporary textarea to copy the text
        const textArea = document.createElement('textarea');
        textArea.value = serverAddress.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Update button text temporarily to show success
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Kopiert!';
        
        setTimeout(function() {
            copyButton.textContent = originalText;
        }, 2000);
    });
});