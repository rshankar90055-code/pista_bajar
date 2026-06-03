import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/app_state.dart';
import '../widgets/premium_feedback.dart';
import '../services/error_handler.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onLoginRequested;
  final VoidCallback? onSignUpRequested;
  final VoidCallback? onAddressManagementRequested;

  const ProfileScreen({
    Key? key,
    this.onLoginRequested,
    this.onSignUpRequested,
    this.onAddressManagementRequested,
  }) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _launchDialer(String number) async {
    final Uri uri = Uri.parse("tel:$number");
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Could not launch phone dialer for $number"),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error launching phone dialer: $e"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildHelpActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    const goldColor = Color(0xFFD4A373);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 4.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: goldColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: goldColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }

  void _showHelpCenterDialog() {
    const goldColor = Color(0xFFD4A373);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(ctx).cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.help_center_rounded, color: goldColor),
            SizedBox(width: 8),
            Text("Help Center", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              "How can we help you today?",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
            ),
            SizedBox(height: 8),
            Text(
              "• Delivery Time: Standard express delivery is 25-35 minutes depending on distance.\n"
              "• Quality Guarantee: All dry fruits from Pista Bajar are premium grade and safety vacuum sealed.\n"
              "• Cancellations: Orders can be cancelled instantly before shipment via the Orders screen.\n"
              "• Support Desk: You can reach us 24/7 at +91 9538069498 for express resolution.",
              style: TextStyle(fontSize: 11, height: 1.5, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Close", style: TextStyle(color: goldColor, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showTermsDialog() {
    const goldColor = Color(0xFFD4A373);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.gavel_rounded, color: goldColor),
            SizedBox(width: 8),
            Text("Terms & Conditions", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF2C160B))),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                "Welcome to Pista Bajar. By purchasing dry fruits from our premium platform, you agree to these standard conditions:",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF2C160B)),
              ),
              SizedBox(height: 12),
              Text(
                "1. Quality Standards: All items are certified natural grade and vacuum sealed to prevent moisture.\n\n"
                "2. Pricing & Payments: Prices listed are final including domestic taxes. COD orders have a processing fee of ₹9.\n\n"
                "3. Delivery Policy: We aim for rapid delivery (25-35 minutes). Delays due to weather are notified instantly.\n\n"
                "4. Return Policy: Since products are perishable food items, returns are only allowed if seal is broken or incorrect package delivered.",
                style: TextStyle(fontSize: 11, height: 1.5, color: Color(0xFF5D4037)),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Accept", style: TextStyle(color: goldColor, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog() {
    const goldColor = Color(0xFFD4A373);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.privacy_tip_rounded, color: goldColor),
            SizedBox(width: 8),
            Text("Privacy Policy", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF2C160B))),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                "Your privacy is our standard luxury commitment. Here is how Pista Bajar secures your details:",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF2C160B)),
              ),
              SizedBox(height: 12),
              Text(
                "1. Data Collection: We collect name, phone, email, and saved addresses solely to facilitate shipping and verification.\n\n"
                "2. Address Persistence: Your addresses are saved securely using encrypted cloud channels on Supabase and only accessible by your authenticated ID.\n\n"
                "3. Security Protocols: No banking details or UPI credentials are ever stored. Payments are verified through deep linked UPI gateways.",
                style: TextStyle(fontSize: 11, height: 1.5, color: Color(0xFF5D4037)),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Close", style: TextStyle(color: goldColor, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showEditProfileBottomSheet(BuildContext context, AppState appState) {
    final nameController = TextEditingController(text: appState.userName);
    final phoneController = TextEditingController(text: appState.userPhone);
    const goldColor = Color(0xFFD4A373);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? const Color(0xFF161616) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            24, 24, 24,
            24 + MediaQuery.of(context).viewInsets.bottom
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Edit Patron Profile",
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                keyboardType: TextInputType.name,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: "Full Name",
                  prefixIcon: const Icon(Icons.person_outline_rounded, color: goldColor, size: 18),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFAF7F2),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  hintStyle: const TextStyle(fontSize: 11, color: Colors.grey),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: goldColor, width: 1.2)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  hintText: "10-Digit Mobile",
                  prefixIcon: const Icon(Icons.phone_android_rounded, color: goldColor, size: 18),
                  prefixText: "+91 ",
                  prefixStyle: const TextStyle(color: goldColor, fontWeight: FontWeight.bold, fontSize: 13),
                  counterText: "",
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFAF7F2),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  hintStyle: const TextStyle(fontSize: 11, color: Colors.grey),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: goldColor, width: 1.2)),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  final newName = nameController.text.trim();
                  final newPhone = phoneController.text.trim();
                  if (newName.isEmpty || newPhone.isEmpty || newPhone.length < 10) {
                    PremiumFeedback.showError(context, "Please enter a valid name and 10-digit mobile number.");
                    return;
                  }
                  try {
                    final success = await appState.updateUserProfile(name: newName, phone: newPhone);
                    if (success && context.mounted) {
                      Navigator.pop(context);
                      PremiumFeedback.showSuccess(context, "Patron profile updated successfully ✨");
                    }
                  } catch (e) {
                    PremiumFeedback.showError(context, ErrorHandler.map(e));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2C160B),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text("Save Profile Changes", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeInOut,
      switchOutCurve: Curves.easeInOut,
      child: appState.isLoggedIn
          ? _buildProfileContent(appState)
          : _buildGuestStateUI(),
    );
  }

  Widget _buildProfileContent(AppState appState) {
    const goldColor = Color(0xFFD4A373);
    return Scaffold(
      key: const ValueKey("profile_content"),
      appBar: AppBar(
        title: const Text(
          "My Account",
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () => appState.refreshCatalog(),
        color: goldColor,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile detail header card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2C160B), Color(0xFF3E2723)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: goldColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: goldColor,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.person_rounded, size: 28, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appState.userName ?? "Patron Guest",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Phone: +91 ${appState.userPhone}",
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            "Premium Member Standard",
                            style: TextStyle(
                              color: goldColor,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_note_rounded, color: goldColor, size: 24),
                      tooltip: "Edit Patron Profile",
                      onPressed: () => _showEditProfileBottomSheet(context, appState),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Saved Addresses Area
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "SAVED ADDRESSES",
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Color(0xFF2C160B)),
                  ),
                  GestureDetector(
                    onTap: () {
                      if (widget.onAddressManagementRequested != null) {
                        widget.onAddressManagementRequested!();
                      }
                    },
                    child: Row(
                      children: const [
                        Icon(Icons.settings_suggest_rounded, size: 14, color: goldColor),
                        SizedBox(width: 4),
                        Text(
                          "Manage All",
                          style: TextStyle(color: goldColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              GestureDetector(
                onTap: () {
                  if (widget.onAddressManagementRequested != null) {
                    widget.onAddressManagementRequested!();
                  }
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE8D9C5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: goldColor, size: 24),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Manage Saved Destinations", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF2C160B))),
                            const SizedBox(height: 2),
                            Text(
                              appState.addresses.isEmpty 
                                  ? "No addresses saved. Tap to add your shipping details."
                                  : "${appState.addresses.length} saved destinations ready for checkout.",
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              // Help & Support Section
              const Text(
                "HELP & SUPPORT",
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Color(0xFF2C160B)),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
                ),
                child: Column(
                  children: [
                    _buildHelpActionTile(
                      icon: Icons.phone_in_talk_rounded,
                      title: "Call Partner",
                      subtitle: "Direct dial support agent for order queries",
                      onTap: () => _launchDialer("9538069498"),
                    ),
                    const Divider(color: Color(0xFFE8D9C5), height: 16),
                    _buildHelpActionTile(
                      icon: Icons.support_agent_rounded,
                      title: "Contact Support",
                      subtitle: "Reach our dry fruit logistics manager",
                      onTap: () => _launchDialer("9538069498"),
                    ),
                    const Divider(color: Color(0xFFE8D9C5), height: 16),
                    _buildHelpActionTile(
                      icon: Icons.help_center_rounded,
                      title: "Help Center",
                      subtitle: "Read our shipping & quality guidelines",
                      onTap: _showHelpCenterDialog,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              // Legal & Policies Section
              const Text(
                "LEGAL & POLICIES",
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Color(0xFF2C160B)),
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
                ),
                child: Column(
                  children: [
                    _buildHelpActionTile(
                      icon: Icons.gavel_rounded,
                      title: "Terms & Conditions",
                      subtitle: "Read our standard emporium terms of service",
                      onTap: _showTermsDialog,
                    ),
                    const Divider(color: Color(0xFFE8D9C5), height: 16),
                    _buildHelpActionTile(
                      icon: Icons.privacy_tip_rounded,
                      title: "Privacy Policy",
                      subtitle: "View how Pista Bajar secures customer data",
                      onTap: _showPrivacyDialog,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              // Log Out Button
              ElevatedButton.icon(
                onPressed: () {
                  appState.logout();
                  PremiumFeedback.showSuccess(context, "Logged out successfully.");
                },
                icon: const Icon(Icons.logout_rounded, size: 16),
                label: const Text("Log Out from Account", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B2D26),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGuestStateUI() {
    const goldColor = Color(0xFFD4A373);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      key: const ValueKey("guest_content"),
      appBar: AppBar(
        title: const Text(
          "Guest Patron Profile",
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Container(
        height: double.infinity,
        width: double.infinity,
        decoration: BoxDecoration(
          image: DecorationImage(
            image: const AssetImage('assets/hero.jpg'),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.mode(
              const Color(0xFF0F240C).withOpacity(0.94), // Premium dark luxury forest green shade overlay
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
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Elegant App Logo & Illustration
                        Container(
                          width: 80,
                          height: 80,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: goldColor.withOpacity(0.1),
                            shape: BoxShape.circle,
                            border: Border.all(color: goldColor.withOpacity(0.3), width: 1.5),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(40),
                            child: Image.asset(
                              'assets/logo.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          "You are currently browsing as",
                          style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500),
                        ),
                        const Text(
                          "Guest",
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: goldColor,
                          ),
                        ),
                        const Text(
                          "PREMIUM ORGANIC DRY FRUITS",
                          style: TextStyle(
                            fontSize: 8, 
                            color: goldColor, 
                            fontWeight: FontWeight.bold, 
                            letterSpacing: 1.5
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Divider(color: Color(0xFFE8D9C5), height: 1),
                        const SizedBox(height: 24),
                        
                        // Benefits list
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            "Benefits of logging in:",
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.2, color: Color(0xFF2C160B)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildBenefitRow(Icons.local_shipping_outlined, "Track Orders", "Monitor your organic dry fruit delivery status in real-time."),
                        const SizedBox(height: 12),
                        _buildBenefitRow(Icons.location_on_outlined, "Save Addresses", "Store multiple emporium & home addresses for express checkout."),
                        const SizedBox(height: 12),
                        _buildBenefitRow(Icons.bolt_rounded, "Faster Checkout", "Place orders in seconds with synced secure sessions."),
                        const SizedBox(height: 12),
                        _buildBenefitRow(Icons.confirmation_num_outlined, "Exclusive Offers", "Unlock standard premium discounts and personalized coupons."),
                        
                        const SizedBox(height: 32),
                        
                        // Dual Buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  if (widget.onLoginRequested != null) {
                                    widget.onLoginRequested!();
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2C160B), // Deep Walnut Brown
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                    side: const BorderSide(color: goldColor, width: 1.2),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: const Text(
                                  'Login',
                                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  if (widget.onSignUpRequested != null) {
                                    widget.onSignUpRequested!();
                                  }
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF2C160B),
                                  side: const BorderSide(color: Color(0xFFD4A373), width: 1.5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: const Text(
                                  'Create Account',
                                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                                ),
                              ),
                            ),
                          ],
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

  Widget _buildBenefitRow(IconData icon, String title, String description) {
    const goldColor = Color(0xFFD4A373);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: goldColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: goldColor, size: 16),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(fontSize: 10, color: Colors.grey, height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
