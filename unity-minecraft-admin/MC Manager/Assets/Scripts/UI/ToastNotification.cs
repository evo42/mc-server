using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
// Note: Removed TMPro reference which may not be available in all projects

namespace MinecraftAdmin.UI
{
    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Error
    }

    public class ToastNotification : MonoBehaviour
    {
        [Header("Toast Configuration")]
        public float displayDuration = 3f;
        public AnimationCurve fadeCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
        
        [Header("UI References")]
        public CanvasGroup canvasGroup;
        public Label messageLabel;  // For UI Toolkit
        public VisualElement backgroundElement;  // For UI Toolkit
        
        private Coroutine displayCoroutine;
        
        // Colors for different notification types
        private Color infoColor = new Color(0.2f, 0.4f, 0.8f, 1); // Blue
        private Color successColor = new Color(0.2f, 0.7f, 0.2f, 1); // Green
        private Color warningColor = new Color(0.9f, 0.7f, 0.2f, 1); // Yellow/Orange
        private Color errorColor = new Color(0.8f, 0.2f, 0.2f, 1); // Red

        public void ShowNotification(string message, NotificationType type = NotificationType.Info, string title = null)
        {
            // Cancel any existing display coroutine
            if (displayCoroutine != null)
                StopCoroutine(displayCoroutine);

            // Update UI elements for UI Toolkit
            if (messageLabel != null)
            {
                messageLabel.text = message;
            }

            // Set color based on notification type
            if (backgroundElement != null)
            {
                switch (type)
                {
                    case NotificationType.Info:
                        backgroundElement.style.backgroundColor = new StyleColor(infoColor);
                        break;
                    case NotificationType.Success:
                        backgroundElement.style.backgroundColor = new StyleColor(successColor);
                        break;
                    case NotificationType.Warning:
                        backgroundElement.style.backgroundColor = new StyleColor(warningColor);
                        break;
                    case NotificationType.Error:
                        backgroundElement.style.backgroundColor = new StyleColor(errorColor);
                        break;
                }
            }

            // Fade in - for UI Toolkit we'll need to handle this differently
            // The CanvasGroup doesn't work with UI Toolkit, so we'll use alpha directly
            if (backgroundElement != null)
            {
                backgroundElement.style.opacity = 0f;
            }

            // Start display coroutine
            displayCoroutine = StartCoroutine(DisplayNotification());
        }
        
        private IEnumerator DisplayNotification()
        {
            // Fade in for UI Toolkit
            float timer = 0f;
            while (timer < 0.5f) // Half a second to fade in
            {
                timer += Time.deltaTime;
                float progress = timer / 0.5f;
                if (backgroundElement != null)
                {
                    backgroundElement.style.opacity = fadeCurve.Evaluate(progress);
                }
                yield return null;
            }

            if (backgroundElement != null)
            {
                backgroundElement.style.opacity = 1f;
            }

            // Wait for display duration
            yield return new WaitForSeconds(displayDuration);

            // Fade out
            timer = 0f;
            while (timer < 0.5f) // Half a second to fade out
            {
                timer += Time.deltaTime;
                float progress = timer / 0.5f;
                if (backgroundElement != null)
                {
                    backgroundElement.style.opacity = 1f - fadeCurve.Evaluate(progress);
                }
                yield return null;
            }

            if (backgroundElement != null)
            {
                backgroundElement.style.opacity = 0f;
            }
        }
    }

    public class NotificationManager : MonoBehaviour
    {
        public static NotificationManager Instance { get; private set; }
        
        [Header("Prefabs")]
        public GameObject toastPrefab;
        
        [Header("Canvas")]
        public Canvas canvas;
        
        private List<ToastNotification> activeToasts = new List<ToastNotification>();
        private Queue<GameObject> toastPool = new Queue<GameObject>();
        
        private void Awake()
        {
            // Singleton pattern
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
                return;
            }
        }
        
        private void Start()
        {
            // Pre-populate the pool with a few toasts
            for (int i = 0; i < 3; i++)
            {
                CreateToastInstance();
            }
        }
        
        private void CreateToastInstance()
        {
            GameObject toastObj = Instantiate(toastPrefab);
            toastObj.transform.SetParent(canvas.transform, false);
            toastObj.SetActive(false);
            
            ToastNotification toast = toastObj.GetComponent<ToastNotification>();
            toastPool.Enqueue(toastObj);
        }
        
        public void ShowNotification(string message, NotificationType type = NotificationType.Info, string title = null)
        {
            GameObject toastObj;
            if (toastPool.Count > 0)
            {
                toastObj = toastPool.Dequeue();
            }
            else
            {
                CreateToastInstance();
                toastObj = toastPool.Dequeue();
            }
            
            ToastNotification toast = toastObj.GetComponent<ToastNotification>();
            toast.ShowNotification(message, type, title);
            
            // Add to active toasts
            activeToasts.Add(toast);
            
            // When the toast is done, return it to the pool
            StartCoroutine(ReturnToPool(toastObj, toast));
        }
        
        private IEnumerator ReturnToPool(GameObject toastObj, ToastNotification toast)
        {
            // Wait a bit longer than the toast display duration to ensure animation has completed
            yield return new WaitForSeconds(toast.displayDuration + 1f);
            
            toastObj.SetActive(false);
            toastPool.Enqueue(toastObj);
            activeToasts.Remove(toast);
        }
    }
}