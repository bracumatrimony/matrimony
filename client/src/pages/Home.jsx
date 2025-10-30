import { Link } from "react-router-dom";
import { Search, ArrowRight, MessageCircle, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SEO from "../components/SEO";
import profileService from "../services/profileService";

export default function Home() {
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch fresh data
        const response = await profileService.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const steps = [
    {
      step: 1,
      title: "Create Profile",
      description:
        "Sign up and create your biodata with BRACU email verification",
      icon: <UserPlus className="w-6 h-6" />,
    },
    {
      step: 2,
      title: "Discover Matches",
      description: "Browse verified biodata with our smart filtering system",
      icon: <Search className="w-6 h-6" />,
    },
    {
      step: 3,
      title: "Start Connecting",
      description:
        "Access contact details freely and begin meaningful conversations",
      icon: <MessageCircle className="w-6 h-6" />,
    },
  ];

  return (
    <>
      <SEO
        title="Find Your Perfect Match"
        description="Campus Matrimony - The premier matrimonial platform for campus community. Find your perfect life partner with advanced search, verified profiles, and secure communication."
        keywords="Campus matrimony, marriage, wedding, life partner, matrimonial, Bangladesh, campus"
      />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-screen">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              backgroundColor: "black",
              filter: "brightness(0.7) contrast(1.08)",
            }}
          >
            <source
              src="https://res.cloudinary.com/dkir6pztp/video/upload/v1761749346/Wedding_Video_t1ebjj.mp4"
              type="video/mp4"
            />
          </video>

          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

          {/* Subtle background gradient (light, mostly-transparent so video remains visible) */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-rose-50/10 pointer-events-none"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 min-h-screen flex items-center">
            <div className="text-center w-full">
              {/* Main heading */}
              <motion.h1
                className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight leading-tight drop-shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  Find Your
                </motion.span>
                <br />
                <motion.span
                  className="block font-medium bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                >
                  Perfect Match
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-xl text-gray-100 mb-12 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                Connecting hearts within the BRAC University community
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <Link
                  to="/search"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-full font-medium transition-all duration-300 hover:bg-gray-100 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/30 text-white rounded-full font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
                >
                  Login / Sign Up
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        {/* Biodata Statistics Section */}
        <motion.section
          className="py-16 bg-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                Community Statistics
              </h2>
              <p className="text-lg text-gray-600">
                Discover the growing community of verified biodatas
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Total Biodatas */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border overflow-hidden text-center p-8 hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="text-4xl font-bold text-rose-500 mb-2">
                  {loading ? "..." : stats.total.toLocaleString()}
                </div>
                <div className="text-gray-600 font-medium">Total Biodatas</div>
              </motion.div>

              {/* Male Biodatas */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border overflow-hidden text-center p-8 hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="text-4xl font-bold text-blue-500 mb-2">
                  {loading ? "..." : stats.male.toLocaleString()}
                </div>
                <div className="text-gray-600 font-medium">Male Biodatas</div>
              </motion.div>

              {/* Female Biodatas */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border overflow-hidden text-center p-8 hover:shadow-md transition-shadow duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="text-4xl font-bold text-pink-500 mb-2">
                  {loading ? "..." : stats.female.toLocaleString()}
                </div>
                <div className="text-gray-600 font-medium">Female Biodatas</div>
              </motion.div>
            </div>
          </div>
        </motion.section>
        {/* Islamic Quote Section */}
        <motion.section
          className="py-24 bg-white relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center">
                {/* Quote container with minimal styling */}
                <motion.div
                  className="max-w-4xl mx-auto"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <motion.blockquote
                    className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-800 leading-relaxed mb-8 tracking-wide"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    When a man marries he has fulfilled half of the religion, so
                    let him fear God regarding the remaining half
                  </motion.blockquote>

                  {/* Simple attribution */}
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <div className="bg-gray-50 px-6 py-3 rounded-full">
                      <cite className="text-lg text-rose-500 font-medium not-italic tracking-wide">
                        Mishkat al-Masabih 3096
                      </cite>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          className="py-24 bg-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.35 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.08 }}
            >
              <motion.h2
                className="text-3xl md:text-4xl font-light text-gray-900 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: 0.12 }}
              >
                How It Works
              </motion.h2>
              <motion.p
                className="text-lg text-gray-600"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: 0.18 }}
              >
                Simple steps to find your life partner
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: 0.18 + index * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <div className="text-center">
                    {/* Step number */}
                    <motion.div
                      className="mb-6"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.28,
                        delay: 0.22 + index * 0.08,
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-500 rounded-xl text-white font-medium text-lg">
                        {step.step}
                      </div>
                    </motion.div>

                    {/* Content */}
                    <motion.h3
                      className="text-xl font-medium text-gray-900 mb-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.28,
                        delay: 0.26 + index * 0.08,
                      }}
                    >
                      {step.title}
                    </motion.h3>
                    <motion.p
                      className="text-gray-600 leading-relaxed"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.28, delay: 0.3 + index * 0.08 }}
                    >
                      {step.description}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </>
  );
}
