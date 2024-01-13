const handleClickTrack = async (product, buttonName) => {
  if (buttonName === 'call') {
    window.location.href = `tel:+91${product.phoneNumber}`;
  } else if (buttonName === 'share') {
    try {
      const sharedContent = {
        title: `Check out this link!`,
        text: 'Explore amazing content from Your Company.',
        url: window.location.href,
      };
  
      if (navigator.share) {
        // Use Web Share API if available
        navigator.share(sharedContent)
          .then(() => console.log('Shared successfully'))
          .catch((error) => console.error('Error sharing:', error));
      } else {
        // Fallback for browsers that do not support Web Share API
        // Implement your custom sharing logic or use a third-party library
        // For simplicity, here's an example using the Clipboard API
        const fallbackText = `${sharedContent.title}\n${sharedContent.text}\n${sharedContent.url}`;
        copyToClipboard(fallbackText);
        alert('Link copied to clipboard. You can manually paste it to share.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }

  }
  try {
    const requestData = {
      productId: product.vendorId,
      buttonName: buttonName,
    };

    // Replace 'your-api-endpoint' with your actual API endpoint
    const response = await fetch(`${BaseAPI}/analysis/track-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      const data = await response.json();

      // Handle the API response as needed
      console.log('API response:', data);
    } else {
      // Handle errors if necessary
      console.error('Failed to share product');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
};


