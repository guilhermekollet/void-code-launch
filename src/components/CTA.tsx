
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Join thousands of satisfied customers who have transformed their ideas into successful projects with our platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Start Your Project
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
