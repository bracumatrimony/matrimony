import { Link } from "react-router-dom";
import SEO from "../components/SEO";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the terms of service for Campus Matrimony. Understand our policies, user responsibilities, and legal agreements for using our matrimonial platform."
        keywords="terms of service, legal terms, Campus matrimony policies, user agreement"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-8 sm:px-10">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Terms of Service
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
                    Acceptance of Terms
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Welcome to Campus Matrimony ("we," "us," or "our"). These
                    Terms of Service ("Terms") govern your access to and use of
                    our matrimonial platform, including our website, mobile
                    applications, and related services (collectively, the
                    "Service"). By accessing, browsing, or using our Service,
                    you acknowledge that you have read, understood, and agree to
                    be bound by these Terms and our Privacy Policy. If you do
                    not agree to these Terms, please do not use our Service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </span>
                    Eligibility and Account Registration
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To use our Service, you must be at least 18 years old and a
                    current or former student of BRAC University. You agree to
                    provide accurate, current, and complete information during
                    the registration process and to update such information to
                    keep it accurate, current, and complete. You are responsible
                    for safeguarding your account credentials and for all
                    activities that occur under your account. You must
                    immediately notify us of any unauthorized use of your
                    account.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </span>
                    User Conduct and Responsibilities
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You agree to use our Service only for lawful purposes and in
                    accordance with these Terms. You are prohibited from:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6 ml-6 space-y-2">
                    <li>Posting false, misleading, or inappropriate content</li>
                    <li>Harassing, abusing, or harming other users</li>
                    <li>Impersonating any person or entity</li>
                    <li>
                      Using the Service for any commercial purposes without our
                      written consent
                    </li>
                    <li>Attempting to interfere with or disrupt the Service</li>
                    <li>
                      Collecting or harvesting user data without permission
                    </li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    You are solely responsible for the content you post and the
                    interactions you have with other users through our platform.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      4
                    </span>
                    Content and Intellectual Property
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our Service allows you to create, post, and share content,
                    including profile information, photos, and messages. You
                    retain ownership of the content you create, but you grant us
                    a worldwide, non-exclusive, royalty-free license to use,
                    display, and distribute your content in connection with the
                    Service. All content on our Service is owned by Campus
                    Matrimony or our licensors and is protected by copyright and
                    other intellectual property laws.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      5
                    </span>
                    Privacy and Data Protection
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Your privacy is important to us. Our collection and use of
                    personal information is governed by our Privacy Policy,
                    which is incorporated into these Terms by reference. By
                    using our Service, you consent to the collection, use, and
                    sharing of your information as described in our Privacy
                    Policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      6
                    </span>
                    Disclaimers and Limitation of Liability
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our Service is provided "as is" and "as available" without
                    warranties of any kind. We do not guarantee that the Service
                    will be uninterrupted, error-free, or secure. To the maximum
                    extent permitted by law, Campus Matrimony shall not be
                    liable for any indirect, incidental, special, or
                    consequential damages arising out of or in connection with
                    your use of the Service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      7
                    </span>
                    Termination
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We reserve the right to terminate or suspend your account
                    and access to the Service at our sole discretion, without
                    prior notice, for conduct that we believe violates these
                    Terms or is harmful to other users, us, or third parties.
                    Upon termination, your right to use the Service will cease
                    immediately. All provisions of these Terms that by their
                    nature should survive termination shall survive, including
                    ownership provisions, warranty disclaimers, and limitations
                    of liability.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      8
                    </span>
                    Changes to Terms
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to modify these Terms at any time. We
                    will notify users of material changes by posting the updated
                    Terms on our website and updating the "Effective Date"
                    above. Your continued use of the Service after such changes
                    constitutes your acceptance of the new Terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                      9
                    </span>
                    Governing Law and Dispute Resolution
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms shall be governed by and construed in accordance
                    with the laws of Bangladesh. Any disputes arising out of or
                    relating to these Terms or the Service shall be resolved
                    through binding arbitration in accordance with the rules of
                    the Bangladesh.
                  </p>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <p className="text-sm text-gray-600">
                    These terms were last updated on October 6, 2025
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
