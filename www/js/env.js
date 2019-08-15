(function (window) {
    window.__env = window.__env || {};
  
    // API url
    window.__env.apiUrl = 'https://sharekey.herokuapp.com/';
    window.__env.chats = 'chats/';
    window.__env.comments = 'comments/';
    window.__env.contacts = 'contacts/';
    window.__env.files = 'upload/';
    window.__env.messages = 'messages/';
    window.__env.posts = 'posts/';
    window.__env.profile = 'profile/';
    window.__env.surveys = 'surveys/'
    window.__env.repos = 'repositories/'
    window.__env.config = 'config/'

    // Base url
    window.__env.baseUrl = '/';
  
    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = true;
  }(this));