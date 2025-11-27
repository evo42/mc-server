using UnityEngine;
using UnityEngine.UIElements;
using MinecraftAdmin.Managers;

namespace MinecraftAdmin.UI
{
    public class LoginView : MonoBehaviour
    {
        [Header("UI Elements")]
        public UIDocument uiDocument;
        
        private VisualElement root;
        private VisualElement loginContainer;
        private TextField usernameField;
        private TextField passwordField;
        private Button loginButton;
        private Label errorLabel;
        
        [Header("Default Credentials")]
        public string defaultUsername = "admin";
        public string defaultPassword = "admin123";
        
        private void OnEnable()
        {
            if (uiDocument != null)
            {
                root = uiDocument.rootVisualElement;
            }
            
            InitializeLoginView();
            
            // Subscribe to authentication events
            AuthenticationManager.Instance.OnAuthenticationSuccess += OnAuthenticationSuccess;
            AuthenticationManager.Instance.OnAuthenticationFailed += OnAuthenticationFailed;
        }
        
        private void OnDisable()
        {
            // Unsubscribe from authentication events
            if (AuthenticationManager.Instance != null)
            {
                AuthenticationManager.Instance.OnAuthenticationSuccess -= OnAuthenticationSuccess;
                AuthenticationManager.Instance.OnAuthenticationFailed -= OnAuthenticationFailed;
            }
        }
        
        public void InitializeLoginView()
        {
            if (root == null) return;
            
            // Clear existing content
            root.Clear();
            
            // Create login container
            loginContainer = new VisualElement();
            loginContainer.style.flexDirection = FlexDirection.Column;
            loginContainer.style.alignItems = Align.Center;
            loginContainer.style.justifyContent = Justify.Center;
            loginContainer.style.height = new Length(100, LengthUnit.Percent);
            loginContainer.style.width = new Length(100, LengthUnit.Percent);
            
            // Title
            var titleLabel = new Label("Minecraft Admin Panel");
            titleLabel.style.fontSize = 24;
            titleLabel.style.unityFontStyleAndWeight = FontStyle.Bold;
            titleLabel.style.marginBottom = 30;
            
            // Username field
            usernameField = new TextField("Username");
            usernameField.value = defaultUsername;
            usernameField.style.width = 300;
            usernameField.style.marginBottom = 10;
            
            // Password field
            passwordField = new TextField("Password");
            passwordField.value = defaultPassword;
            passwordField.isPasswordField = true;
            passwordField.style.width = 300;
            passwordField.style.marginBottom = 10;
            
            // Login button
            loginButton = new Button(AttemptLogin);
            loginButton.text = "Login";
            loginButton.style.width = 300;
            loginButton.style.marginBottom = 10;
            
            // Error label
            errorLabel = new Label();
            errorLabel.style.color = Color.red;
            errorLabel.style.display = DisplayStyle.None;
            errorLabel.style.marginBottom = 10;
            
            // Add elements to container
            loginContainer.Add(titleLabel);
            loginContainer.Add(usernameField);
            loginContainer.Add(passwordField);
            loginContainer.Add(loginButton);
            loginContainer.Add(errorLabel);
            
            root.Add(loginContainer);
        }
        
        private void AttemptLogin()
        {
            string username = usernameField.value;
            string password = passwordField.value;
            
            // Validate input
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ShowError("Username and password are required");
                return;
            }
            
            // Clear any previous errors
            HideError();
            
            // Disable login button while authenticating
            loginButton.SetEnabled(false);
            loginButton.text = "Logging in...";
            
            // Attempt authentication
            AuthenticationManager.Instance.Authenticate(username, password);
        }
        
        private void OnAuthenticationSuccess()
        {
            // Re-enable the button
            loginButton.SetEnabled(true);
            loginButton.text = "Login";
            
            // Hide error if shown
            HideError();
            
            // In a full implementation, we would transition to the main app
            // For now, we'll just show a notification
            if (NotificationManager.Instance != null)
            {
                NotificationManager.Instance.ShowNotification("Login successful!", NotificationType.Success);
            }
            else
            {
                Debug.Log("Login successful!");
            }
        }
        
        private void OnAuthenticationFailed()
        {
            // Re-enable the button
            loginButton.SetEnabled(true);
            loginButton.text = "Login";
            
            // Show error
            ShowError("Invalid username or password");
        }
        
        private void ShowError(string message)
        {
            errorLabel.text = message;
            errorLabel.style.display = DisplayStyle.Flex;
        }
        
        private void HideError()
        {
            errorLabel.style.display = DisplayStyle.None;
        }
    }
}