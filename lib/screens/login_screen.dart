import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../services/error_handler.dart';
import '../widgets/premium_feedback.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  final AuthMode initialMode;

  const LoginScreen({
    Key? key,
    required this.onLoginSuccess,
    this.initialMode = AuthMode.signIn,
  }) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

enum AuthMode { signIn, signUp }

class _LoginScreenState extends State<LoginScreen> {
  late AuthMode _authMode;

  // Form Controllers
  final _emailController = TextEditingController(); // Used for Login (Email/Phone) and Signup (Email)
  final _passwordController = TextEditingController(); // Used for Login (Password) and Signup (Password)
  final _regNameController = TextEditingController();
  final _regPhoneController = TextEditingController();

  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _authMode = widget.initialMode;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _regNameController.dispose();
    _regPhoneController.dispose();
    super.dispose();
  }

  void _switchMode(AuthMode mode) {
    setState(() {
      _authMode = mode;
      _errorMessage = null;
      _successMessage = null;
    });
  }

  // Regex validators
  bool _isValidEmail(String email) {
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    return emailRegex.hasMatch(email);
  }

  bool _isValidIndianPhone(String phone) {
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    return phoneRegex.hasMatch(phone);
  }

  // Handle email/password sign-in or sign-up
  void _handleSubmit() async {
    final state = context.read<AppState>();
    
    setState(() {
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      if (_authMode == AuthMode.signUp) {
        final name = _regNameController.text.trim();
        final email = _emailController.text.trim();
        final phone = _regPhoneController.text.trim();
        final password = _passwordController.text.trim();

        if (name.isEmpty) {
          setState(() {
            _errorMessage = "Please enter your Full Name.";
          });
          return;
        }
        if (email.isEmpty || !_isValidEmail(email)) {
          setState(() {
            _errorMessage = "Please enter a valid email address.";
          });
          return;
        }
        if (phone.isEmpty || !_isValidIndianPhone(phone)) {
          setState(() {
            _errorMessage = "Please enter a valid 10-digit Indian mobile number.";
          });
          return;
        }
        if (password.isEmpty || password.length < 6) {
          setState(() {
            _errorMessage = "Password must be at least 6 characters long.";
          });
          return;
        }

        await state.registerWithEmail(
          email: email,
          password: password,
          name: name,
          phone: phone,
        );
        
        // Instant redirect after successful registration
        if (state.isLoggedIn) {
          widget.onLoginSuccess();
        } else {
          setState(() {
            _successMessage = "Account created successfully! Please sign in.";
            _authMode = AuthMode.signIn;
          });
        }
      } else {
        final emailOrPhone = _emailController.text.trim();
        final password = _passwordController.text.trim();

        if (emailOrPhone.isEmpty) {
          setState(() {
            _errorMessage = "Please enter your email address or mobile number.";
          });
          return;
        }

        if (emailOrPhone.contains('@')) {
          if (!_isValidEmail(emailOrPhone)) {
            setState(() {
              _errorMessage = "Please enter a valid email address.";
            });
            return;
          }
        } else {
          if (!_isValidIndianPhone(emailOrPhone)) {
            setState(() {
              _errorMessage = "Please enter a valid 10-digit Indian mobile number.";
            });
            return;
          }
        }

        if (password.isEmpty || password.length < 6) {
          setState(() {
            _errorMessage = "Password must be at least 6 characters long.";
          });
          return;
        }

        await state.loginWithEmail(emailOrPhone, password);
        widget.onLoginSuccess();
      }
    } catch (e) {
      final prettyError = ErrorHandler.map(e);
      setState(() {
        _errorMessage = prettyError;
      });
      if (mounted) {
        PremiumFeedback.showError(context, prettyError);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);

    return Scaffold(
      body: Container(
        height: double.infinity,
        width: double.infinity,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: const AssetImage('assets/hero.jpg'),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              const Color(0xFF0F240C).withOpacity(0.92), // Premium dark luxury forest green shade overlay
              BlendMode.srcOver,
            ),
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
              physics: const BouncingScrollPhysics(),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 450),
                child: Card(
                  color: isDark ? const Color(0xFF161616).withOpacity(0.95) : const Color(0xFFFFFDF9).withOpacity(0.96),
                  elevation: 24,
                  shadowColor: Colors.black.withOpacity(0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                    side: BorderSide(color: goldColor.withOpacity(0.3), width: 1.5),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Luxury Brand Signifier
                        Column(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Image.asset(
                                'assets/logo.png',
                                width: 90,
                                height: 90,
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: 18),
                            const Text(
                              'Pista Bajar',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'PREMIUM ORGANIC DRY FRUITS',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 10,
                                color: goldColor,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 3,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Error Box
                        if (_errorMessage != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF7B2D26).withOpacity(0.08),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFD4A373).withOpacity(0.3), width: 1.2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                const Text("⚠️", style: TextStyle(fontSize: 16)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(
                                      color: Color(0xFFE57373), 
                                      fontSize: 11, 
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Success Box
                        if (_successMessage != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF386B39).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFF386B39), width: 1),
                            ),
                            child: Text(
                              _successMessage!,
                              style: const TextStyle(color: Color(0xFF81C784), fontSize: 11, fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Dynamic forms based on active mode
                        AnimatedSize(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                          child: _buildForm(isDark),
                        ),

                        // Continue as Guest Option
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: widget.onLoginSuccess, // Direct bypass
                          child: const Text(
                            "Continue as Guest Patron ➔",
                            style: TextStyle(
                              color: goldColor, 
                              fontSize: 11, 
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(bool isDark) {
    switch (_authMode) {
      case AuthMode.signIn:
        return _buildSignInForm(isDark);
      case AuthMode.signUp:
        return _buildSignUpForm(isDark);
    }
  }

  Widget _buildSignInForm(bool isDark) {
    const goldColor = Color(0xFFD4A373);
    return Column(
      key: const ValueKey("signIn"),
      children: [
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.text,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("Email Address or Phone Number", Icons.person_outline_rounded, isDark),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: true,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("Password Credentials", Icons.lock_outline_rounded, isDark),
        ),
        const SizedBox(height: 20),

        ElevatedButton(
          onPressed: _handleSubmit,
          style: _buildButtonStyle(),
          child: const Text('Verify Credentials & Sign In'),
        ),
        const SizedBox(height: 14),

        // Switching Links
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("New Patron?", style: TextStyle(color: isDark ? Colors.white30 : Colors.black45, fontSize: 11)),
            TextButton(
              onPressed: () => _switchMode(AuthMode.signUp),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: const Size(0, 30)),
              child: const Text("Create Account", style: TextStyle(color: goldColor, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSignUpForm(bool isDark) {
    const goldColor = Color(0xFFD4A373);
    return Column(
      key: const ValueKey("signUp"),
      children: [
        TextField(
          controller: _regNameController,
          keyboardType: TextInputType.name,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("Full Name / Username", Icons.person_outline_rounded, isDark),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("Email Address", Icons.email_outlined, isDark),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _regPhoneController,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("10-Digit Phone Number", Icons.phone_android_rounded, isDark).copyWith(
            prefixText: "+91 ",
            prefixStyle: const TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13),
            counterText: "",
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: true,
          style: const TextStyle(fontSize: 13),
          decoration: _buildInputDecoration("Choose Password (6+ chars)", Icons.lock_outline_rounded, isDark),
        ),
        const SizedBox(height: 20),

        ElevatedButton(
          onPressed: _handleSubmit,
          style: _buildButtonStyle(),
          child: const Text('Create Premium Patron Account'),
        ),
        const SizedBox(height: 14),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Already registered?", style: TextStyle(color: isDark ? Colors.white30 : Colors.black45, fontSize: 11)),
            TextButton(
              onPressed: () => _switchMode(AuthMode.signIn),
              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: const Size(0, 30)),
              child: const Text("Sign In Here", style: TextStyle(color: goldColor, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _buildInputDecoration(String hint, IconData icon, bool isDark) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: const Color(0xFFD4A373), size: 16),
      filled: true,
      fillColor: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFAF7F2),
      contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      hintStyle: const TextStyle(fontSize: 11, color: Colors.grey),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFFD4A373), width: 1.5),
      ),
    );
  }

  ButtonStyle _buildButtonStyle() {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF2C160B), // Walnut brown luxury tint
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 48),
      elevation: 4,
      shadowColor: const Color(0xFF2C160B).withOpacity(0.3),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
    );
  }
}
