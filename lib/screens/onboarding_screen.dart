import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onFinish;

  const OnboardingScreen({Key? key, required this.onFinish}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  bool _isLastPage = false;

  final List<Map<String, String>> _slides = [
    {
      "image": "https://images.unsplash.com/photo-1543157148-f7911951f308?w=800&auto=format&fit=crop&q=80",
      "tag": "GOLD STANDARD HARVEST",
      "title": "Curated Luxury Organic Dry Fruits",
      "desc": "Discover high-end pistachios, handpicked raw almonds, and authentic Kashmiri saffron carefully sourced for health-conscious patrons.",
    },
    {
      "image": "https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&auto=format&fit=crop&q=80",
      "tag": "ROYAL CELEBRATIONS",
      "title": "Artisanal Combos & Luxury Gift Boxes",
      "desc": "Mark your grand celebrations with our gold-trimmed combinations, customized wooden boxes, and standard walnut assortments.",
    },
    {
      "image": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
      "tag": "FRESHNESS SECURED DISPATCH",
      "title": "Swift Delivery Direct to Your Emporium",
      "desc": "Enjoy trackable, nitrogen-locked express shipping that preserves rich organic flavors and delivers standard quality within minutes.",
    },
  ];

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('seen_onboarding', true);
    widget.onFinish();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFD4A373);
    const darkBg = Color(0xFF0C1A0A); // Premium ultra-dark warm forest green

    return Scaffold(
      backgroundColor: darkBg,
      body: SafeArea(
        child: Stack(
          children: [
            // Background Image Tinted Layer
            Positioned.fill(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 500),
                child: Container(
                  key: ValueKey<int>(_currentIndex),
                  decoration: BoxDecoration(
                    image: DecorationImage(
                      image: NetworkImage(_slides[_currentIndex]["image"]!),
                      fit: BoxFit.cover,
                      colorFilter: ColorFilter.mode(
                        darkBg.withOpacity(0.88),
                        BlendMode.srcOver,
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Main sliding layout content
            Column(
              children: [
                // Top Header actions (Skip)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Miniature logo signifier
                      Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.asset(
                              'assets/logo.png',
                              width: 45,
                              height: 45,
                              fit: BoxFit.contain,
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            "Pista Bajar",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      
                      // Skip Button
                      if (!_isLastPage)
                        GestureDetector(
                          onTap: _completeOnboarding,
                          child: const Text(
                            "Skip Now",
                            style: TextStyle(
                              color: goldColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Slide pages
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: _slides.length,
                    onPageChanged: (index) {
                      setState(() {
                        _currentIndex = index;
                        _isLastPage = index == _slides.length - 1;
                      });
                    },
                    itemBuilder: (context, index) {
                      final slide = _slides[index];
                      return Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Spacer(flex: 2),
                            // Tag
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: goldColor.withOpacity(0.12),
                                border: Border.all(color: goldColor.withOpacity(0.3), width: 1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                slide["tag"]!,
                                style: const TextStyle(
                                  color: goldColor,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Bold Title
                            Text(
                              slide["title"]!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Elegant Description
                            Text(
                              slide["desc"]!,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.72),
                                fontSize: 13,
                                height: 1.5,
                              ),
                            ),
                            const Spacer(),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Slide Progress and CTA Button
                Padding(
                  padding: const EdgeInsets.fromLTRB(32, 0, 32, 40),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Active Page Indicators
                      Row(
                        children: List.generate(
                          _slides.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(right: 6),
                            height: 6,
                            width: _currentIndex == index ? 24 : 6,
                            decoration: BoxDecoration(
                              color: _currentIndex == index ? goldColor : Colors.white24,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),

                      // Next/Get Started Button with Tap scale behavior
                      GestureDetector(
                        onTap: () {
                          if (_isLastPage) {
                            _completeOnboarding();
                          } else {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeInOut,
                            );
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          decoration: BoxDecoration(
                            color: goldColor,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(
                                color: goldColor.withOpacity(0.4),
                                blurRadius: 16,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _isLastPage ? "Get Started" : "Next Slide",
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
