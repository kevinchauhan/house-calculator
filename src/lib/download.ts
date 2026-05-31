/**
 * Programmatically downloads any file from a URL by fetching it as a blob.
 * This bypasses cross-origin browser policies and forces a direct download prompt.
 */
export const triggerDownload = async (url: string, filename: string) => {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (err) {
        console.error('Failed to trigger download, falling back to open in tab:', err);
        window.open(url, '_blank');
    }
};
