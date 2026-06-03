import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'providers/app_state.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/detail_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/tracking_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/offers_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/address_management_screen.dart';
import 'widgets/luxury_bottom_nav.dart';
import 'models/product.dart';
import 'models/order.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase in production mode using ONLY client publishable key
  await Supabase.initialize(
    url: 'https://kanlpcchindylhrmwqbt.supabase.co',
    anonKey: 'sb_publishable_llGmCaWmoufKfSCYkiQwIg_yq8hi2ay',
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()),
      ],
      child: const PistaBajarApp(),
    ),
  );
}

class PistaBajarApp extends StatelessWidget {
  const PistaBajarApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pista Bajar',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      
      // Gorgeous Luxury Warm Light Theme
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFAF7F2), // Warm Cream White
        primaryColor: const Color(0xFFD4A373), // Luxury Gold
        cardColor: Colors.white,
        hintColor: const Color(0xFF5D4037), // Dark Walnut Brown secondary
        dividerColor: const Color(0xFFE8D9C5), // Royal Almond Beige Line
        
        textTheme: const TextTheme(
          displayLarge: TextStyle(color: Color(0xFF121212), fontWeight: FontWeight.w800),
          titleLarge: TextStyle(color: Color(0xFF121212), fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: Color(0xFF121212)),
          bodyMedium: TextStyle(color: Color(0xFF5D4037)),
        ),
        
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFD4A373),
          secondary: Color(0xFF3E2723), // Walnut Brown
          surface: Colors.white,
          error: Color(0xFF7B2D26), // Maroon
        ),
        useMaterial3: true,
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({Key? key}) : super(key: key);

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  String _activeScreen = "splash";
  Product? _selectedProduct;
  Order? _placedOrder;
  AuthMode _loginInitialMode = AuthMode.signIn;
  String _addressPrevScreen = "profile";

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    // Route transitions based on login state
    if (_activeScreen == "splash") {
      return SplashScreen(
        onComplete: () async {
          final prefs = await SharedPreferences.getInstance();
          final seenOnboarding = prefs.getBool('seen_onboarding') ?? false;
          
          setState(() {
            if (appState.isLoggedIn) {
              _activeScreen = "home";
            } else if (!seenOnboarding) {
              _activeScreen = "onboarding";
            } else {
              _activeScreen = "login";
            }
          });
        },
      );
    }

    if (_activeScreen == "login" && appState.isLoggedIn) {
      // Auto redirect to home after login verification succeeds
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() {
          _activeScreen = "home";
        });
      });
    }

    return Scaffold(
      body: SafeArea(
        top: _activeScreen != "home", // home uses custom translucent top headers
        bottom: false,
        child: Stack(
          children: [
            // Render target screen body
            Positioned.fill(
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: ["detail", "checkout", "tracking"].contains(_activeScreen) 
                      ? MediaQuery.of(context).padding.bottom 
                      : 0.0, // Span full screen behind floating navigation bar
                ),
                child: _buildScreen(context),
              ),
            ),
            
            // Fixed bottom navigation overlay (comply with UX rules)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: LuxuryBottomNav(
                activeScreen: _activeScreen,
                onScreenSelected: (screen) {
                  setState(() {
                    _activeScreen = screen;
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScreen(BuildContext context) {
    switch (_activeScreen) {
      case "onboarding":
        return OnboardingScreen(
          onFinish: () {
            setState(() {
              _activeScreen = "login";
            });
          },
        );
      case "login":
        return LoginScreen(
          initialMode: _loginInitialMode,
          onLoginSuccess: () {
            setState(() {
              _activeScreen = "home";
            });
          },
        );
      case "home":
        return HomeScreen(
          onProductSelected: (product) {
            setState(() {
              _selectedProduct = product;
              _activeScreen = "detail";
            });
          },
          onProfileTapped: () {
            setState(() {
              _activeScreen = "profile";
            });
          },
          onOffersTapped: () {
            setState(() {
              _activeScreen = "offers";
            });
          },
          onNotificationsTapped: () {
            setState(() {
              _activeScreen = "notifications";
            });
          },
          onAddressTapped: () {
            setState(() {
              _addressPrevScreen = "home";
              _activeScreen = "address_management";
            });
          },
        );
      case "detail":
        if (_selectedProduct == null) {
          return const Center(child: Text("Product not selected"));
        }
        return DetailScreen(
          product: _selectedProduct!,
          onBack: () {
            setState(() {
              _activeScreen = "home";
            });
          },
          onBuyNow: () {
            setState(() {
              _activeScreen = "cart";
            });
          },
        );
      case "cart":
        return CartScreen(
          onProceedToCheckout: () {
            setState(() {
              _activeScreen = "checkout";
            });
          },
          onShopNow: () {
            setState(() {
              _activeScreen = "home";
            });
          },
        );
      case "checkout":
        return CheckoutScreen(
          onBack: () {
            setState(() {
              _activeScreen = "cart";
            });
          },
          onOrderConfirmed: (order) {
            setState(() {
              _placedOrder = order;
              _activeScreen = "tracking";
            });
          },
        );
      case "tracking":
        if (_placedOrder == null) {
          return const Center(child: Text("No active orders found."));
        }
        return TrackingScreen(
          order: _placedOrder!,
          onBackToHome: () {
            setState(() {
              _placedOrder = null;
              _activeScreen = "home";
            });
          },
        );
      case "profile":
        return ProfileScreen(
          onLoginRequested: () {
            setState(() {
              _loginInitialMode = AuthMode.signIn;
              _activeScreen = "login";
            });
          },
          onSignUpRequested: () {
            setState(() {
              _loginInitialMode = AuthMode.signUp;
              _activeScreen = "login";
            });
          },
          onAddressManagementRequested: () {
            setState(() {
              _addressPrevScreen = "profile";
              _activeScreen = "address_management";
            });
          },
        );
      case "address_management":
        return AddressManagementScreen(
          onBack: () {
            setState(() {
              _activeScreen = _addressPrevScreen;
            });
          },
        );
      case "offers":
        return OffersScreen(
          onBack: () {
            setState(() {
              _activeScreen = "home";
            });
          },
        );
      case "notifications":
        return NotificationsScreen(
          onBack: () {
            setState(() {
              _activeScreen = "home";
            });
          },
        );
      case "history":
      default:
        return OrdersScreen(
          onTrackOrder: (order) {
            setState(() {
              _placedOrder = order;
              _activeScreen = "tracking";
            });
          },
        );
    }
  }
}
