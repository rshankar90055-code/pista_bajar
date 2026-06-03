import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class NotificationsScreen extends StatelessWidget {
  final VoidCallback onBack;

  const NotificationsScreen({Key? key, required this.onBack}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const goldColor = Color(0xFFD4A373);

    // Dynamic mock activity feed based on user logged-in details to feel premium and customized
    final List<Map<String, String>> mockNotifications = [
      if (appState.isLoggedIn) ...[
        {
          "emoji": "🚚",
          "title": "Out for Premium Delivery!",
          "body": "Hi ${appState.userName}, your order PB-${DateTime.now().millisecondsSinceEpoch - 1200000} is out with our nitrogen-preservation dispatch. ETA: 12 minutes.",
          "time": "Just now",
          "tag": "DELIVERY",
        },
        {
          "emoji": "✅",
          "title": "Organic Order Confirmed",
          "body": "Your payment transaction was securely processed. Thank you for shopping organic dry fruits at Pista Bajar central emporium.",
          "time": "20 Mins Ago",
          "tag": "SYSTEM",
        },
      ],
      {
        "emoji": "🏷️",
        "title": "Royal launch coupon active!",
        "body": "Apply coupon PISTA50 during checkout to get Flat 50% discount on your first handpicked organic cashews purchase.",
        "time": "2 Hours Ago",
        "tag": "OFFERS",
      },
      {
        "emoji": "🌿",
        "title": "Fresh Kashmiri Kesar Restocked",
        "body": "Our premium Srinagar valleys saffron harvest is back in stock. Pure, grade-A filaments handpicked for royal quality.",
        "time": "1 Day Ago",
        "tag": "CATALOG",
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ACTIVITY NOTIFICATIONS',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: onBack,
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: mockNotifications.isEmpty
            ? _buildEmptyState(context)
            : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                itemCount: mockNotifications.length,
                itemBuilder: (context, index) {
                  final notif = mockNotifications[index];
                  return _buildNotificationCard(context, notif, isDark, goldColor);
                },
              ),
      ),
    );
  }

  Widget _buildNotificationCard(BuildContext context, Map<String, String> notif, bool isDark, Color goldColor) {
    Color tagColor;
    switch (notif["tag"]) {
      case "DELIVERY":
        tagColor = const Color(0xFF386B39);
        break;
      case "OFFERS":
        tagColor = goldColor;
        break;
      case "CATALOG":
        tagColor = const Color(0xFF7B2D26);
        break;
      default:
        tagColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161616) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8D9C5), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3E2723).withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Graphic Emoji Container
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: tagColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: tagColor.withOpacity(0.2), width: 1),
            ),
            child: Center(
              child: Text(
                notif["emoji"]!,
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ),
          
          const SizedBox(width: 14),
          
          // Details content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Dynamic tag label
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: tagColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        notif["tag"]!,
                        style: TextStyle(
                          color: tagColor,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    
                    // Timestamp text
                    Text(
                      notif["time"]!,
                      style: const TextStyle(
                        fontSize: 9,
                        color: Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 8),
                
                // Bold Title
                Text(
                  notif["title"]!,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 4),
                
                // Dynamic description body
                Text(
                  notif["body"]!,
                  style: TextStyle(
                    color: Theme.of(context).hintColor,
                    fontSize: 11,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("🔔", style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            const Text(
              "No Notifications Yet",
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              "Any order dispatches, live delivery ETAs, and premium brand launch deals will appear here.",
              style: TextStyle(color: Theme.of(context).hintColor, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
