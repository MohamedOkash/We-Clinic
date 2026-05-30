import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Try to determine language from localStorage
      let isAr = true;
      try {
        const savedLang = localStorage.getItem('clinic_lang');
        if (savedLang) {
          isAr = JSON.parse(savedLang) === 'ar';
        }
      } catch (e) {
        // Fallback
        isAr = document.documentElement.dir === 'rtl';
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/25 animate-pulse">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-white tracking-wide">
                {isAr ? 'عذراً! حدث خطأ غير متوقع' : 'Oops! Something went wrong'}
              </h2>
              
              <p className="text-slate-400 text-sm leading-relaxed">
                {isAr 
                  ? 'لقد واجه التطبيق مشكلة تقنية تؤثر على استمرارية العمل. يمكنك محاولة إعادة تحميل الصفحة.' 
                  : 'The application encountered a technical issue affecting operations. You can try reloading the page.'}
              </p>

              {this.state.error && (
                <div className="w-full bg-slate-950/80 p-3 rounded-lg text-left text-xs font-mono text-red-400/90 overflow-x-auto max-h-32 border border-slate-800">
                  {this.state.error.toString()}
                </div>
              )}

              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-red-600/20 active:scale-[0.98] transition-all duration-200"
              >
                {isAr ? 'إعادة تحميل التطبيق' : 'Reload Application'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
