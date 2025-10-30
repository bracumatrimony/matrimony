import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn about Campus Matrimony's privacy policy. Understand how we collect, use, and protect your personal information on our matrimonial platform."
        keywords="privacy policy, data protection, Campus matrimony privacy, personal information"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-8 sm:px-10">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Privacy Policy
                </h1>
                <p className="text-rose-100 text-sm">
                  Effective Date: October 6, 2025
                </p>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 lg:px-12">
              <div className="prose prose-lg prose-gray max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      1
                    </span>
                    Introduction
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Privacy Policy explains how Campus Matrimony ("we,"
                    "us," or "our") collects, uses, discloses, and safeguards
                    your information when you use our matrimonial platform and
                    related services (collectively, the "Service").By using our
                    Service, you agree to the collection and use of information
                    in accordance with this policy. We will not use or share
                    your information with anyone except as described in this
                    Privacy Policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </span>
                    Information We Collect
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Information You Provide Directly
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                        <li>
                          Account registration information (name, email, BRACU
                          affiliation)
                        </li>
                        <li>
                          Profile information (personal details, preferences,
                          photos)
                        </li>
                        <li>
                          Communication data (messages, feedback, support
                          requests)
                        </li>
                        <li>
                          Payment information (when using premium features)
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Information Collected Automatically
                      </h3>
                      <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                        <li>
                          Device information (IP address, browser type,
                          operating system)
                        </li>
                        <li>
                          Usage data (pages visited, features used, time spent)
                        </li>
                        <li>
                          Location data (approximate location based on IP
                          address)
                        </li>
                        <li>Cookies and similar tracking technologies</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </span>
                    How We Use Your Information
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use the information we collect for the following
                    purposes:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6 ml-6 space-y-2">
                    <li>
                      <strong>Service Provision:</strong> To create and manage
                      your account, provide matchmaking services, and facilitate
                      connections
                    </li>
                    <li>
                      <strong>Communication:</strong> To send you important
                      updates, respond to your inquiries, and provide customer
                      support
                    </li>
                    <li>
                      <strong>Platform Improvement:</strong> To analyze usage
                      patterns, improve our services, and develop new features
                    </li>
                    <li>
                      <strong>Security:</strong> To detect and prevent fraud,
                      abuse, and security incidents
                    </li>
                    <li>
                      <strong>Legal Compliance:</strong> To comply with
                      applicable laws and regulations
                    </li>
                    <li>
                      <strong>Marketing:</strong> To send you promotional
                      materials (with your consent)
                    </li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      4
                    </span>
                    Information Sharing and Disclosure
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We do not sell, trade, or rent your personal information to
                    third parties. We may share your information only in the
                    following circumstances:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6 ml-6 space-y-2">
                    <li>
                      <strong>With Your Consent:</strong> When you explicitly
                      agree to share information
                    </li>
                    <li>
                      <strong>Service Providers:</strong> With trusted
                      third-party service providers who assist in operating our
                      platform
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> When required by law,
                      court order, or government regulation
                    </li>
                    <li>
                      <strong>Safety and Security:</strong> To protect the
                      rights, property, or safety of our users or the public
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> In connection with a
                      merger, acquisition, or sale of assets
                    </li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      5
                    </span>
                    Data Security
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We implement industry-standard security measures to protect
                    your personal information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6 ml-6 space-y-2">
                    <li>Encryption of data in transit and at rest</li>
                    <li>
                      Regular security audits and vulnerability assessments
                    </li>
                    <li>Access controls and employee training</li>
                    <li>Secure data centers and infrastructure</li>
                    <li>Regular backups and disaster recovery procedures</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    However, no method of transmission over the internet or
                    electronic storage is 100% secure. While we strive to
                    protect your personal information, we cannot guarantee
                    absolute security.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      6
                    </span>
                    Your Rights and Choices
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the following rights regarding your personal
                    information:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Access & Portability
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request a copy of your personal data
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Correction
                      </h4>
                      <p className="text-sm text-gray-600">
                        Update or correct inaccurate information
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Deletion
                      </h4>
                      <p className="text-sm text-gray-600">
                        Request deletion of your personal data
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Restriction
                      </h4>
                      <p className="text-sm text-gray-600">
                        Limit how we process your data
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    To exercise these rights, please contact us using the
                    information provided below. We will respond to your request
                    within 30 days.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      7
                    </span>
                    Changes to This Privacy Policy
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time to
                    reflect changes in our practices or legal requirements. We
                    will notify you of any material changes by:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6 ml-6 space-y-2">
                    <li>Posting the updated policy on our website</li>
                    <li>Displaying a prominent notice on our platform</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    Your continued use of our Service after the effective date
                    of changes constitutes acceptance of the updated Privacy
                    Policy.
                  </p>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <p className="text-sm text-gray-600">
                    This privacy policy was last updated on October 6, 2025
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
