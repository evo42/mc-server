using UnityEngine;

namespace MinecraftAdmin.Managers
{
    public enum ApplicationState
    {
        Login,
        Dashboard,
        ServerList,
        Datapacks,
        ServerConfiguration,
        BackupManagement
    }

    public class StateManager : MonoBehaviour
    {
        public static StateManager Instance { get; private set; }
        
        private ApplicationState currentState = ApplicationState.Login;
        public ApplicationState CurrentState 
        { 
            get { return currentState; }
            private set 
            { 
                currentState = value;
                OnStateChanged?.Invoke(currentState);
            }
        }
        
        // Events
        public System.Action<ApplicationState> OnStateChanged;

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
            }
        }

        private void Start()
        {
            // Start in Login state
            CurrentState = ApplicationState.Login;
        }

        public void ChangeState(ApplicationState newState)
        {
            CurrentState = newState;
        }

        public void GoToDashboard()
        {
            CurrentState = ApplicationState.Dashboard;
        }

        public void GoToServerList()
        {
            CurrentState = ApplicationState.ServerList;
        }

        public void GoToDatapacks()
        {
            CurrentState = ApplicationState.Datapacks;
        }

        private string currentServerForConfig;

        public void GoToServerConfiguration(string serverName = null)
        {
            currentServerForConfig = serverName;
            CurrentState = ApplicationState.ServerConfiguration;
        }

        public string GetCurrentServerForConfig()
        {
            return currentServerForConfig;
        }

        public void GoToBackupManagement(string serverName = null)
        {
            // This would need additional parameters to specify which server
            CurrentState = ApplicationState.BackupManagement;
        }

        public void Logout()
        {
            CurrentState = ApplicationState.Login;
        }
    }
}