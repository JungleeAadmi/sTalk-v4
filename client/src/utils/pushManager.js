const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeUser = async (userId) => {
  try {
    // STEP 1: Check Browser Support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("❌ Error: Push API not supported on this browser.");
      return false;
    }

    // STEP 2: Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert("❌ Error: Permission denied. Check iPhone Settings > Web Apps.");
      return false;
    }
    alert("✅ Step 1: Permission Granted");

    // STEP 3: FORCE Register Service Worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        alert("⚠️ Service Worker missing. Installing...");
        registration = await navigator.serviceWorker.register('/sw.js');
    }
    
    // Wait for it to be active
    if (!registration.active) {
        alert("⏳ Waiting for SW to activate...");
        await new Promise(r => setTimeout(r, 2000)); 
    }
    
    alert("✅ Step 2: Service Worker Active");

    // STEP 4: Get Server Key
    const response = await fetch('/api/vapid-key');
    if(!response.ok) throw new Error("Failed to fetch VAPID key");
    const { key } = await response.json();
    alert("✅ Step 3: VAPID Key Received");

    // STEP 5: Subscribe to Apple
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        // Simple check: just unsubscribe to be safe so we get a fresh one
        await subscription.unsubscribe();
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
    alert("✅ Step 4: Got ID from Apple");

    // STEP 6: Send to Server
    const saveRes = await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ userId, subscription }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(`Server Rejected: ${errText}`);
    }

    alert("🎉 SUCCESS: Connected! You can now click 'Send Test'.");
    return true;

  } catch (err) {
    alert(`❌ CRITICAL FAILURE: ${err.message}`);
    console.error(err);
    return false;
  }
};
