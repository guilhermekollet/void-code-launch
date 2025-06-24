
import { Code2, Palette, Zap, Shield, Globe, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Code2,
      title: "Modern Development",
      description: "Built with the latest technologies and best practices for optimal performance and maintainability."
    },
    {
      icon: Palette,
      title: "Beautiful Design",
      description: "Stunning visual experiences that captivate users and reflect your brand's unique identity."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed with instant loading times and smooth interactions across all devices."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security and reliability you can trust for your most important projects."
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Designed to scale globally with robust infrastructure and worldwide accessibility."
    },
    {
      icon: Users,
      title: "User Focused",
      description: "Every feature is crafted with user experience in mind, ensuring intuitive and delightful interactions."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features and tools designed to help you build, grow, and scale your vision into reality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 group"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
