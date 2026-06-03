import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:ui';
import '../providers/app_state.dart';

class LuxuryBottomNav extends StatelessWidget {
  final String activeScreen;
  final Function(String) onScreenSelected;

  const LuxuryBottomNav({
    Key? key,
    required this.activeScreen,
    required this.onScreenSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Hide navigation entirely on Action/Welcome screens (splash, onboarding, login, detail, checkout, tracking, offers, notifications, address_management)
    final hiddenScreens = ["splash", "onboarding", "login", "detail", "checkout", "tracking", "offers", "notifications", "address_management"];
    if (hiddenScreens.contains(activeScreen)) {
      return const SizedBox.shrink();
    }

    // Hide navigation when keyboard is open to prevent cramping the screen
    if (MediaQuery.of(context).viewInsets.bottom > 0) {
      return const SizedBox.shrink();
    }

    final cartCount = context.watch<AppState>().cart.length;

    return SafeArea(
      top: false,
      left: false,
      right: false,
      bottom: true,
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.24), // Sleek drop shadow
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14), // Modern frosted blur
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor.withOpacity(0.78), // Translucent backing
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: const Color(0xFFD4A373).withOpacity(0.28), // Luxury Gold border
                  width: 1.2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(
                    context: context,
                    screen: "home",
                    icon: Icons.storefront_rounded,
                    label: "Store",
                  ),
                  _buildNavItem(
                    context: context,
                    screen: "cart",
                    icon: Icons.shopping_bag_outlined,
                    label: "Cart",
                    badgeCount: cartCount,
                  ),
                  _buildNavItem(
                    context: context,
                    screen: "history",
                    icon: Icons.receipt_long_rounded,
                    label: "Orders",
                  ),
                  _buildNavItem(
                    context: context,
                    screen: "profile",
                    icon: Icons.person_outline_rounded,
                    label: "Profile",
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required String screen,
    required IconData icon,
    required String label,
    int badgeCount = 0,
  }) {
    final isActive = activeScreen == screen;
    final activeColor = const Color(0xFFD4A373); // Luxury Gold
    final inactiveColor = Theme.of(context).hintColor;

    return GestureDetector(
      onTap: () => onScreenSelected(screen),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        decoration: BoxDecoration(
          color: isActive ? activeColor.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  color: isActive ? activeColor : inactiveColor,
                  size: 20,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: -6,
                    top: -6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFD4A373), // Gold badge
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 14,
                        minHeight: 14,
                      ),
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 7,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isActive ? activeColor : inactiveColor,
                fontSize: 10,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
