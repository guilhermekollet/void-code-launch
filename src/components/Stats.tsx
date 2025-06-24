
const Stats = () => {
  const stats = [
    { number: "10k+", label: "Happy Customers" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Expert Support" },
    { number: "150+", label: "Countries Served" }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="group">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.number}
              </div>
              <div className="text-blue-100 text-lg font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
