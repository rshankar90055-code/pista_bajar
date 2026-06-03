import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../models/address.dart';
import '../models/offer.dart';
import '../models/order.dart';
import '../services/supabase_service.dart';
import '../services/error_handler.dart';

class CartItem {
  final String productId;
  final String selectedWeight; // '250g', '500g', '1kg'
  final double quantity; // number of packs ordered

  CartItem({
    required this.productId,
    required this.selectedWeight,
    required this.quantity,
  });

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'selected_weight': selectedWeight,
    'quantity': quantity,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    productId: json['product_id']?.toString() ?? json['productId']?.toString() ?? '',
    selectedWeight: (json['selected_weight'] ?? json['selectedWeight']) as String? ?? '1kg',
    quantity: (json['quantity'] as num?)?.toDouble() ?? 1.0,
  );
}

class AppState with ChangeNotifier {
  final SupabaseService _db = SupabaseService();

  // User details
  String? _userId;
  String? _userName;
  String? _userPhone;
  String? _userEmail;

  // Active Catalog loaded from Supabase
  List<Product> _products = [];
  List<Offer> _offers = [];
  List<SavedAddress> _addresses = []; // Loaded from local cache for fast user management

  // Local/Remote synchronized carts & wishlists
  final Map<String, CartItem> _cart = {}; // Map of productId -> CartItem
  List<String> _wishlist = []; // List of productIds

  // Checkout variables
  bool _isGift = false;
  String? _giftNote;
  bool _giftWrap = false;
  String _paymentMethod = "upi"; // upi | cash_on_delivery
  String _upiApp = "gpay"; // gpay | phonepe
  bool _isDirectQrPayment = false;
  String? _upiScreenshot; // base64 receipt stub

  // Coupons
  Offer? _activeOffer;
  String? _discountCode;
  int _discountAmount = 0;

  bool _isLoading = false;
  String? _catalogError;

  // Getters
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userPhone => _userPhone;
  String? get userEmail => _userEmail;
  bool get isLoggedIn => _userId != null;

  List<Product> get products => _products;
  List<Offer> get offers => _offers;
  List<SavedAddress> get addresses => _addresses;
  Map<String, CartItem> get cart => _cart;
  List<String> get wishlist => _wishlist;

  bool get isGift => _isGift;
  String? get giftNote => _giftNote;
  bool get giftWrap => _giftWrap;
  String get paymentMethod => _paymentMethod;
  String get upiApp => _upiApp;
  bool get isDirectQrPayment => _isDirectQrPayment;
  String? get upiScreenshot => _upiScreenshot;

  Offer? get activeOffer => _activeOffer;
  String? get discountCode => _discountCode;
  int get discountAmount => _discountAmount;
  bool get isLoading => _isLoading;
  String? get catalogError => _catalogError;

  AppState() {
    _initSupabaseState();
  }

  // 1. Initialize session and subscribe to auth state updates
  void _initSupabaseState() {
    _db.authStateChanges.listen((data) async {
      final session = data.session;
      if (session != null) {
        _userId = session.user.id;
        _userEmail = session.user.email;
        
        // Query user details from profile table
        final profile = await _db.fetchUserProfile(_userId!);
        if (profile != null) {
          _userName = profile['name'] as String?;
          _userPhone = profile['phone'] as String?;
        } else {
          _userName = session.user.userMetadata?['name'] as String? ?? 'Patron Guest';
          _userPhone = session.user.phone ?? '';
        }
        await _syncFromSupabase();
      } else {
        _userId = null;
        _userName = null;
        _userPhone = null;
        _userEmail = null;
        _addresses.clear(); // Safe state purge on logout
        _cart.clear();
        _wishlist.clear();
      }
      notifyListeners();
    });
    _loadLocalCache();
  }

  // Synchronize dynamic cart and wishlist from Supabase
  Future<void> _syncFromSupabase() async {
    if (_userId == null) return;
    
    // 1. Fetch Wishlist
    final remoteWishlist = await _db.fetchWishlist(_userId!);
    _wishlist = remoteWishlist;

    // 2. Fetch Cart
    final remoteCart = await _db.fetchCart(_userId!);
    _cart.clear();
    for (var item in remoteCart) {
      final cartItem = CartItem.fromJson(item);
      _cart[cartItem.productId] = cartItem;
    }

    // 3. Fetch Saved Addresses from Supabase
    try {
      final remoteAddresses = await _db.fetchAddresses(_userId!);
      _addresses = remoteAddresses.map((item) => SavedAddress.fromSupabaseJson(item)).toList();
      await _saveAddressesToLocalCache();
    } catch (e) {
      debugPrint("AppState: fetchAddresses failed from Supabase: $e");
    }
    
    _recalculateTotals();
    notifyListeners();
  }

  Future<void> _saveAddressesToLocalCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(_addresses.map((a) => a.toJson()).toList());
      await prefs.setString('cached_saved_addresses', encoded);
    } catch (e) {
      debugPrint("AppState Error: failed to save addresses cache: $e");
    }
  }

  // 2. Local cache loaders (fast recovery)
  Future<void> _loadLocalCache() async {
    refreshCatalog();
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString('cached_saved_addresses');
      if (cachedJson != null) {
        final List<dynamic> decoded = jsonDecode(cachedJson);
        _addresses = decoded.map((item) => SavedAddress.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint("AppState Error: failed to load cached addresses: $e");
    }
  }

  // 3. Database Catalog Refresh
  Future<void> refreshCatalog() async {
    _isLoading = true;
    _catalogError = null;
    notifyListeners();

    try {
      _products = await _db.fetchProducts();
      final fetchedOffers = await _db.fetchOffers();
      
      // Automatically filter out inactive and expired coupons
      _offers = fetchedOffers.where((offer) {
        if (!offer.active) return false;
        if (offer.expiryDate.isNotEmpty) {
          try {
            final expiry = DateTime.parse(offer.expiryDate);
            // Check if current time is after the expiry date
            if (DateTime.now().isAfter(expiry)) {
              return false;
            }
          } catch (_) {}
        }
        return true;
      }).toList();

      if (isLoggedIn && _userId != null) {
        await _syncFromSupabase();
      }
    } catch (e) {
      debugPrint("AppState Error: refreshCatalog failed: $e");
      _catalogError = ErrorHandler.map(e);
    } finally {
      _isLoading = false;
      _recalculateTotals();
      notifyListeners();
    }
  }

  // 4. Authentication triggers
  Future<bool> registerWithEmail({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Registering email='$email', name='$name', phone='$phone' with Supabase...");
      final res = await _db.signUpWithEmail(email: email, password: password, name: name, phone: phone);
      debugPrint("AppState: Registration successful. User created: ${res.user?.id}");
      
      // Frictionless instant login after signup
      debugPrint("AppState: Performing instant login...");
      final loginRes = await _db.loginWithEmailOrPhone(email, password);
      if (loginRes.user != null) {
        _userId = loginRes.user!.id;
        _userEmail = loginRes.user!.email;
        
        final profile = await _db.fetchUserProfile(_userId!);
        if (profile != null) {
          _userName = profile['name'] as String?;
          _userPhone = profile['phone'] as String?;
        } else {
          _userName = name;
          _userPhone = phone;
        }
        debugPrint("AppState: Instant login successful. User ID: $_userId, Name: $_userName");
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: Supabase registration failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> loginWithEmail(String emailOrPhone, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Logging in emailOrPhone='$emailOrPhone' with Supabase...");
      final res = await _db.loginWithEmailOrPhone(emailOrPhone, password);
      if (res.user != null) {
        _userId = res.user!.id;
        _userEmail = res.user!.email;
        
        final profile = await _db.fetchUserProfile(_userId!);
        if (profile != null) {
          _userName = profile['name'] as String?;
          _userPhone = profile['phone'] as String?;
        } else {
          _userName = res.user!.userMetadata?['name'] as String? ?? 'Patron Guest';
          _userPhone = res.user!.phone ?? '';
        }
        debugPrint("AppState: Login successful. User ID: $_userId, Name: $_userName");
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: Supabase login failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Initiating Google OAuth signIn...");
      final success = await _db.signInWithGoogle();
      debugPrint("AppState: Google OAuth success=$success");
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      debugPrint("AppState Error: Google OAuth failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> requestPhoneOtp(String phone) async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Requesting phone OTP for phone='$phone' with Supabase...");
      await _db.signInWithPhone(phone);
      debugPrint("AppState: Phone OTP requested successfully.");
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: Phone OTP request failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> verifyPhoneOtp(String phone, String code, {String? name}) async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Verifying phone OTP for phone='$phone' with token='$code'...");
      final res = await _db.verifyPhoneOtp(phone, code);
      if (res.user != null) {
        _userId = res.user!.id;
        _userPhone = phone;
        _userName = name ?? res.user!.userMetadata?['name'] as String? ?? 'Patron Guest';
        await _db.saveUserProfile(
          userId: _userId!,
          name: _userName!,
          phone: _userPhone!,
          email: res.user!.email ?? '',
        );
        debugPrint("AppState: Phone OTP verified. User ID: $_userId");
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: Phone OTP verification failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // Update user profile inside AppState and remote Supabase db
  Future<bool> updateUserProfile({required String name, required String phone}) async {
    if (_userId == null) return false;
    _userName = name;
    _userPhone = phone;
    notifyListeners();

    try {
      debugPrint("AppState: Updating profile in Supabase for user='$_userId'...");
      await _db.saveUserProfile(
        userId: _userId!,
        name: name,
        phone: phone,
        email: _userEmail ?? '',
      );
      debugPrint("AppState: Profile updated successfully.");
      return true;
    } catch (e) {
      debugPrint("AppState Error: Profile update failed: $e");
      rethrow;
    }
  }

  void logout() async {
    try {
      debugPrint("AppState: Logging out from Supabase...");
      await _db.logout();
    } catch (e) {
      debugPrint("AppState Error: Supabase logout failed: $e");
    }
    _userId = null;
    _userName = null;
    _userPhone = null;
    _userEmail = null;

    _cart.clear();
    _wishlist.clear();
    _addresses.clear();
    _activeOffer = null;
    _discountCode = null;
    _discountAmount = 0;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cached_saved_addresses');
    } catch (_) {}

    _recalculateTotals();
    notifyListeners();
    debugPrint("AppState: Session cleared locally.");
  }

  Future<void> resetPasswordForEmail(String email) async {
    _isLoading = true;
    notifyListeners();
    try {
      debugPrint("AppState: Requesting password reset for email='$email'...");
      await _db.resetPasswordForEmail(email);
      debugPrint("AppState: Password reset instructions sent.");
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      debugPrint("AppState Error: Password reset failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // 5. Cart Operations
  Future<void> updateCart(String productId, String weight, double quantity) async {
    if (quantity <= 0) {
      _cart.remove(productId);
      if (isLoggedIn && _userId != null) {
        await _db.removeFromCart(_userId!, productId);
      }
    } else {
      _cart[productId] = CartItem(productId: productId, selectedWeight: weight, quantity: quantity);
      if (isLoggedIn && _userId != null) {
        await _db.addToCart(_userId!, productId, quantity, weight);
      }
    }
    _recalculateTotals();
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    if (isLoggedIn && _userId != null) {
      _db.clearCart(_userId!);
    }
    _recalculateTotals();
    notifyListeners();
  }

  // 6. Wishlist Operations
  Future<void> toggleWishlist(String productId) async {
    final exists = _wishlist.contains(productId);
    if (exists) {
      _wishlist.remove(productId);
    } else {
      _wishlist.add(productId);
    }
    notifyListeners();

    if (isLoggedIn && _userId != null) {
      await _db.toggleWishlist(_userId!, productId, !exists);
    }
  }

  // 7. Saved Address CRUD (Fully cloud-persisted, no local caches)
  // 7. Saved Address CRUD (Fully cloud-persisted, no local caches)
  Future<bool> addAddress(SavedAddress address) async {
    if (!isLoggedIn || _userId == null) return false;
    _isLoading = true;
    notifyListeners();
    
    try {
      final finalAddress = SavedAddress(
        id: address.id,
        phone: address.phone.isNotEmpty ? address.phone : (_userPhone ?? ""),
        name: address.name,
        contactPhone: address.contactPhone,
        isDefault: address.isDefault,
        createdAt: address.createdAt.isNotEmpty ? address.createdAt : DateTime.now().toIso8601String(),
        addressLine: address.addressLine,
        city: address.city,
        pinCode: address.pinCode,
        landmark: address.landmark,
        state: address.state,
        userId: _userId!,
        house: address.house,
        area: address.area,
      );

      await _db.saveAddress(finalAddress.toSupabaseJson());
      await _syncFromSupabase();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: addAddress failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> updateAddress(SavedAddress address) async {
    if (!isLoggedIn || _userId == null) return false;
    _isLoading = true;
    notifyListeners();

    try {
      final finalAddress = SavedAddress(
        id: address.id,
        phone: address.phone,
        name: address.name,
        contactPhone: address.contactPhone,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: DateTime.now().toIso8601String(),
        addressLine: address.addressLine,
        city: address.city,
        pinCode: address.pinCode,
        landmark: address.landmark,
        state: address.state,
        userId: _userId!,
        house: address.house,
        area: address.area,
      );

      await _db.saveAddress(finalAddress.toSupabaseJson());
      await _syncFromSupabase();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: updateAddress failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> setDefaultAddress(String addressId) async {
    if (!isLoggedIn || _userId == null) return false;
    
    // Find the target address to modify
    final target = _addresses.firstWhere((a) => a.id == addressId, orElse: () => _addresses.first);
    if (target.id.isEmpty) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final updated = SavedAddress(
        id: target.id,
        phone: target.phone,
        name: target.name,
        contactPhone: target.contactPhone,
        isDefault: true, // Mark this one as default; DB trigger will clear all others
        createdAt: target.createdAt,
        updatedAt: DateTime.now().toIso8601String(),
        addressLine: target.addressLine,
        city: target.city,
        pinCode: target.pinCode,
        landmark: target.landmark,
        state: target.state,
        userId: _userId!,
        house: target.house,
        area: target.area,
      );

      await _db.saveAddress(updated.toSupabaseJson());
      await _syncFromSupabase();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: setDefaultAddress failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> removeAddress(String addressId) async {
    if (!isLoggedIn || _userId == null) return false;
    _isLoading = true;
    notifyListeners();

    try {
      await _db.deleteAddress(addressId);
      await _syncFromSupabase(); // DB trigger automatically handles reassigning defaults
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("AppState Error: removeAddress failed: $e");
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // 8. Coupon Code validations
  Future<String?> applyCoupon(String code) async {
    // Fetch all active coupons from the DB to check if it's expired or valid
    List<Offer> allActiveCoupons = [];
    try {
      allActiveCoupons = await _db.fetchOffers();
    } catch (_) {
      allActiveCoupons = _offers; // fallback to locally cached ones
    }

    final matchingCoupon = allActiveCoupons.firstWhere(
      (offer) => offer.code.toLowerCase() == code.toLowerCase(),
      orElse: () => Offer(id: '', code: '', discount: 0, minimumOrder: 0, expiryDate: '', active: false),
    );

    if (matchingCoupon.id.isEmpty) {
      return "Invalid coupon code.";
    }

    // Expiry Date Validation
    if (matchingCoupon.expiryDate.isNotEmpty) {
      try {
        final expiry = DateTime.parse(matchingCoupon.expiryDate);
        if (DateTime.now().isAfter(expiry)) {
          return "Coupon Expired";
        }
      } catch (_) {}
    }

    if (subtotal < matchingCoupon.minimumOrder) {
      return "Minimum order not reached";
    }

    // Usage Limit Validation
    if (matchingCoupon.usageLimit != null && matchingCoupon.usedCount != null) {
      if (matchingCoupon.usedCount! >= matchingCoupon.usageLimit!) {
        return "This coupon has reached its usage limit.";
      }
    }

    if (isLoggedIn && _userId != null) {
      final alreadyUsed = await _db.checkCouponUsed(_userId!, matchingCoupon.id);
      if (alreadyUsed) {
        return "Coupon already used";
      }
    }

    _activeOffer = matchingCoupon;
    _discountCode = matchingCoupon.code;
    _recalculateTotals();
    notifyListeners();
    return null;
  }

  void removeCoupon() {
    _activeOffer = null;
    _discountCode = null;
    _discountAmount = 0;
    _recalculateTotals();
    notifyListeners();
  }

  // 9. Calculations
  int get subtotal {
    int total = 0;
    _cart.forEach((productId, item) {
      final product = _products.firstWhere(
        (p) => p.id == productId,
        orElse: () => Product(id: '', name: '', description: '', imageUrl: '', category: '', stock: 0, price250g: 0, price500g: 0, price1kg: 0, rating: 0),
      );
      if (product.id.isNotEmpty) {
        total += (product.getPriceForWeight(item.selectedWeight) * item.quantity).round();
      }
    });
    return total;
  }

  int get discount {
    if (_activeOffer != null && subtotal > 0) {
      return (subtotal * (_activeOffer!.discount / 100)).round();
    }
    return 0;
  }

  int get codFee => (_paymentMethod == "cash_on_delivery") ? 9 : 0;
  int get giftWrapFee => (_isGift && _giftWrap) ? 49 : 0;
  int get deliveryFee => 0; // FREE Delivery globally!
  int get platformFee => 0; // Removed platform charges globally
  int get totalAmount => subtotal - discount + codFee + giftWrapFee;

  void _recalculateTotals() {
    _discountAmount = discount;
  }

  // 10. Checkout Preferences Sets
  void setGiftPreferences({required bool isGift, String? note, required bool wrap}) {
    _isGift = isGift;
    _giftNote = note;
    _giftWrap = wrap;
    _recalculateTotals();
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    _recalculateTotals();
    notifyListeners();
  }

  void setUpiApp(String app) {
    _upiApp = app;
    _isDirectQrPayment = false;
    notifyListeners();
  }

  void setDirectQrPayment(bool value) {
    _isDirectQrPayment = value;
    notifyListeners();
  }

  void setUpiScreenshot(String? base64Str) {
    _upiScreenshot = base64Str;
    notifyListeners();
  }

  // 11. Create Order inside Supabase transactional schemas
  Future<Order?> placeOrder(SavedAddress deliveryAddress) async {
    if (!isLoggedIn || _userId == null || _cart.isEmpty) return null;

    final orderItemsInput = _cart.entries.map((entry) {
      final product = _products.firstWhere((p) => p.id == entry.key);
      final price = product.getPriceForWeight(entry.value.selectedWeight);
      return OrderItem(
        productId: entry.key,
        name: product.name,
        quantity: entry.value.quantity,
        selectedWeight: entry.value.selectedWeight,
        subtotal: (price * entry.value.quantity).round(),
      );
    }).toList();

    _isLoading = true;
    notifyListeners();

    try {
      final order = await _db.placeOrder(
        userId: _userId!,
        totalAmount: totalAmount,
        paymentMethod: _paymentMethod,
        address: deliveryAddress,
        items: orderItemsInput,
        couponId: _activeOffer?.id,
      );

      if (order != null) {
        _cart.clear();
        _activeOffer = null;
        _discountCode = null;
        _discountAmount = 0;
      }
      return order;
    } catch (e) {
      debugPrint("AppState Error: placeOrder failed: $e");
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
