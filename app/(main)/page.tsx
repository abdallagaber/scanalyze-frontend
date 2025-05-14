"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MoveRight,
  Microscope,
  PieChart,
  Stethoscope,
  Shield,
  Menu,
  X,
  Info,
  Bell,
  AlertCircle,
  Search,
  UserCircle,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [cookieConsentShown, setCookieConsentShown] = useState(false);
  const sectionRefs = {
    services: useRef(null),
    features: useRef(null),
    testimonials: useRef(null),
    contact: useRef(null),
  };

  useEffect(() => {
    // Check for authentication token in cookies
    const token = getCookie("token");
    const role = getCookie("role") as string | null;

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }

    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const header = document.getElementById("header");

    // Function to handle scroll events
    const handleScroll = () => {
      // Handle header shadow on scroll
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
        // Apply shadow class directly
        const header = document.getElementById("header");
        if (header) {
          if (isScrolled) {
            header.classList.add("shadow-md");
            header.classList.remove("shadow-sm");
          } else {
            header.classList.remove("shadow-md");
            header.classList.add("shadow-sm");
          }
        }
      }

      // Show/hide back to top button
      setShowBackToTop(window.scrollY > 300);

      // Update active section based on scroll position - more robust implementation
      const sections = [
        "home",
        "services",
        "features",
        "testimonials",
        "contact",
      ];

      // Calculate current scroll position accounting for header
      const scrollPosition = window.scrollY + headerHeight;

      // Find the section that should be active
      let newActiveSection = "home"; // Default to home

      // Check each section
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;

          // If we've scrolled past the top of this section and not past its bottom
          if (
            scrollPosition >= offsetTop - headerHeight &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            newActiveSection = section;
            break;
          }
        }
      }

      // Update active section if changed
      if (newActiveSection !== activeSection) {
        setActiveSection(newActiveSection);
      }
    };

    // Function to update header height and related measurements
    const updateHeaderHeight = () => {
      if (header) {
        const height = header.offsetHeight;
        setHeaderHeight(height);

        // Only apply padding to the main element in this page, not the body
        const mainElement = document.querySelector("main");
        if (mainElement) {
          mainElement.style.paddingTop = `${height}px`;
        }
      }
    };

    // Initial calculation
    updateHeaderHeight();

    // Event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeaderHeight, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeaderHeight);

      // Clean up any padding that might have been applied
      document.body.style.paddingTop = "";
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.style.paddingTop = "";
      }
    };
  }, [scrolled, activeSection, headerHeight]);

  useEffect(() => {
    // Create intersection observer for animation
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => [...prev, entry.target.id]);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Observe all section refs
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Check if user has already consented to cookies
    const hasConsented = localStorage.getItem("cookieConsent") === "true";
    setCookieConsentShown(hasConsented);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setActiveSection(id);

    // Special case for home
    if (id === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = headerHeight + 10; // Add some buffer
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isActive = (section: string) => {
    // For debugging - uncomment if needed
    // console.log('Current active section:', activeSection, 'Checking section:', section);
    return activeSection === section;
  };

  // Function to get the dashboard URL based on user role
  const getDashboardUrl = () => {
    switch (userRole) {
      case "admin":
        return "/dashboard/admin";
      case "doctor":
        return "/dashboard/doctor";
      case "patient":
        return "/dashboard/patient";
      case "lab_technician":
        return "/dashboard/lab";
      case "scan_technician":
        return "/dashboard/scan";
      default:
        return "/dashboard";
    }
  };

  // Helper to check if section is visible
  const isSectionVisible = (sectionId: string) => {
    return visibleSections.includes(sectionId);
  };

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setCookieConsentShown(true);
  };

  // Reset active section to home when mobile menu is opened
  const handleMobileMenuToggle = () => {
    // If we're opening the menu and at the top of the page, ensure home is active
    if (!mobileMenuOpen && window.scrollY < 100) {
      setActiveSection("home");
    }
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Initialize active section based on scroll position when component mounts
  useEffect(() => {
    // Set initial active section based on scroll position
    const scrollPosition = window.scrollY;
    if (scrollPosition < 100) {
      setActiveSection("home");
    }
  }, []);

  return (
    <main className="flex-1 w-full h-full flex flex-col">
      {/* Header - Sticky */}
      <header
        id="header"
        className="w-full bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out shadow-sm"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("home");
              }}
              className="flex items-center space-x-2 transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <Image
                src="/images/scanalyze-logo.png"
                alt="Scanalyze Logo"
                width={150}
                height={50}
                className="h-10 md:h-12 w-auto"
                priority
                quality={100}
                unoptimized
              />
            </a>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("home")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("home") ? "page" : undefined}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("services");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("services")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("services") ? "page" : undefined}
              >
                Services
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("features")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("features") ? "page" : undefined}
              >
                Features
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("testimonials");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("testimonials")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("testimonials") ? "page" : undefined}
              >
                Testimonials
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("contact");
                }}
                className={`font-medium py-2 transition-all duration-300 ease-in-out border-b-2 ${
                  isActive("contact")
                    ? "text-scanalyze-600 border-scanalyze-600"
                    : "text-gray-600 border-transparent hover:text-scanalyze-600 hover:border-scanalyze-300"
                }`}
                aria-current={isActive("contact") ? "page" : undefined}
              >
                Contact
              </a>
            </nav>

            {/* Auth buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href={getDashboardUrl()}>
                  <Button className="scanalyze-button-primary transition-all duration-300 ease-in-out hover:scale-105 flex items-center space-x-2">
                    <UserCircle className="h-5 w-5 mr-1" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="scanalyze-button-outline transition-all duration-300 ease-in-out hover:scale-105"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="scanalyze-button-primary transition-all duration-300 ease-in-out hover:scale-105">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - Visible only on mobile */}
            <div className="md:hidden flex items-center">
              <button
                className="text-gray-500 hover:text-scanalyze-600 transition-colors duration-300 p-2 rounded-md touch-manipulation"
                onClick={handleMobileMenuToggle}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-[500px] opacity-100 border-t border-gray-100 py-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col space-y-4 mb-6">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("home");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("home")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("home") ? "page" : undefined}
              >
                Home
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("services");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("services")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("services") ? "page" : undefined}
              >
                Services
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("features")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("features") ? "page" : undefined}
              >
                Features
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("testimonials");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("testimonials")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("testimonials") ? "page" : undefined}
              >
                Testimonials
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("contact");
                }}
                className={`font-medium py-3 transition-colors duration-300 ease-in-out pl-3 ${
                  isActive("contact")
                    ? "text-scanalyze-600 border-l-4 border-scanalyze-600"
                    : "text-gray-600 hover:text-scanalyze-600 hover:pl-4"
                } touch-manipulation`}
                aria-current={isActive("contact") ? "page" : undefined}
              >
                Contact
              </a>
            </nav>
            <div className="flex flex-col space-y-3 px-1">
              {isAuthenticated ? (
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="scanalyze-button-primary w-full py-6 transition-transform duration-300 hover:scale-105 flex items-center justify-center touch-manipulation">
                    <UserCircle className="h-5 w-5 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="scanalyze-button-outline w-full py-6 transition-transform duration-300 hover:scale-105 touch-manipulation"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="scanalyze-button-primary w-full py-6 transition-transform duration-300 hover:scale-105 touch-manipulation">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div
        id="home"
        className="w-full scanalyze-gradient min-h-[92vh] flex items-center"
      >
        <div className="container mx-auto px-4 py-16 md:py-20 lg:py-32 flex flex-col items-center">
          {/* Logo - Visible only on mobile */}
          <div className="md:hidden w-full flex justify-center mb-10 transform transition-transform duration-700 hover:scale-105">
            {isLoading ? (
              <Skeleton className="w-[320px] h-[120px] rounded-lg" />
            ) : (
              <Image
                src="/images/scanalyze-logo.png"
                alt="Scanalyze Medical Imaging"
                width={400}
                height={280}
                className="object-contain w-full max-w-[320px]"
                priority
                quality={100}
                unoptimized
              />
            )}
          </div>

          {/* Content container - flex-row only on md+ screens */}
          <div className="w-full flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0 md:pr-4 lg:pr-8">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-3/4 mb-4" />
                  <Skeleton className="h-12 w-1/2 mb-8" />
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-6 w-5/6 mb-3" />
                  <Skeleton className="h-6 w-4/6 mb-8" />
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                    <Skeleton className="h-14 w-full sm:w-36" />
                    <Skeleton className="h-14 w-full sm:w-36" />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-scanalyze-800 mb-6 md:mb-8 leading-tight">
                    Advanced Medical Diagnostics{" "}
                    <span className="text-scanalyze-600">Simplified</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 md:mb-10 max-w-xl">
                    Scanalyze delivers cutting-edge laboratory testing and
                    medical imaging with fast, accurate results. Your complete
                    health information at your fingertips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                    <Link href="/login">
                      <Button
                        size="lg"
                        className="scanalyze-button-primary px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg h-auto w-full sm:w-auto transition-transform duration-300 hover:scale-105 touch-manipulation"
                      >
                        Get Started{" "}
                        <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        size="lg"
                        variant="outline"
                        className="scanalyze-button-outline px-6 sm:px-8 py-6 sm:py-7 text-base sm:text-lg h-auto w-full sm:w-auto transition-transform duration-300 hover:scale-105 touch-manipulation"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Logo - Hidden on mobile, visible on md+ screens */}
            <div className="hidden md:flex md:w-1/2 justify-center transform transition-transform duration-700 hover:scale-105">
              {isLoading ? (
                <Skeleton className="w-[500px] h-[350px] rounded-lg" />
              ) : (
                <Image
                  src="/images/scanalyze-logo.png"
                  alt="Scanalyze Medical Imaging"
                  width={600}
                  height={420}
                  className="object-contain w-full max-w-[500px] lg:max-w-[600px]"
                  priority
                  quality={100}
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-6 sm:py-8 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12">
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-20" />
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-scanalyze-600 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    HIPAA Compliant
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-scanalyze-600 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    Fast Results
                  </span>
                </div>
                <div className="flex items-center">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-scanalyze-600 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    Certified Labs
                  </span>
                </div>
                <div className="flex items-center">
                  <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-scanalyze-600 mr-2" />
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    Expert Care
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div
        id="services"
        ref={sectionRefs.services}
        className={`py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("services") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-scanalyze-800 mb-3 sm:mb-4">
              Our Comprehensive Services
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our range of advanced diagnostic services designed to
              provide accurate insights for better healthcare decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Service Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
              <div className="bg-scanalyze-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                <Microscope className="h-7 w-7 text-scanalyze-600" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-3">
                Laboratory Testing
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive blood work, urine analysis, and specialized
                diagnostic tests with rapid results.
              </p>
              <a
                href="#"
                className="text-scanalyze-600 font-medium flex items-center group"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Service Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
              <div className="bg-scanalyze-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                <PieChart className="h-7 w-7 text-scanalyze-600" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-3">
                Medical Imaging
              </h3>
              <p className="text-gray-600 mb-4">
                Advanced MRI, CT, X-ray, and ultrasound scans with expert
                analysis and digital access.
              </p>
              <a
                href="#"
                className="text-scanalyze-600 font-medium flex items-center group"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Service Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
              <div className="bg-scanalyze-50 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-5">
                <FileText className="h-7 w-7 text-scanalyze-600" />
              </div>
              <h3 className="text-xl font-bold text-scanalyze-800 mb-3">
                Digital Health Records
              </h3>
              <p className="text-gray-600 mb-4">
                Secure access to your complete health history, test results, and
                doctor's notes in one place.
              </p>
              <a
                href="#"
                className="text-scanalyze-600 font-medium flex items-center group"
              >
                Learn more{" "}
                <MoveRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        ref={sectionRefs.features}
        className={`py-16 md:py-24 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("features") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-scanalyze-800 mb-4">
              Why Choose Scanalyze
            </h2>
            <p className="text-gray-600">
              We combine advanced technology with personalized care to provide
              the best diagnostic experience possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Fast Turnaround Times
                </h3>
                <p className="text-gray-600">
                  Get results within 24-48 hours for most tests, allowing for
                  quicker diagnosis and treatment.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  State-of-the-Art Equipment
                </h3>
                <p className="text-gray-600">
                  Our facilities are equipped with the latest diagnostic
                  technology for the most accurate results.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Expert Medical Team
                </h3>
                <p className="text-gray-600">
                  Our specialists are board-certified with years of experience
                  in medical diagnostics.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex">
              <div className="mr-4 mt-1">
                <CheckCircle className="h-6 w-6 text-scanalyze-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-scanalyze-800 mb-2">
                  Secure Digital Access
                </h3>
                <p className="text-gray-600">
                  Review your results online through our secure patient portal
                  anytime, anywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-scanalyze-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">98%</p>
              <p className="text-scanalyze-100">Patient Satisfaction</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">24h</p>
              <p className="text-scanalyze-100">Average Result Time</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">50+</p>
              <p className="text-scanalyze-100">Specialized Tests</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">15+</p>
              <p className="text-scanalyze-100">Years of Excellence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div
        id="testimonials"
        ref={sectionRefs.testimonials}
        className={`py-16 md:py-24 bg-gray-50 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("testimonials") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-scanalyze-800 mb-4">
              What Our Patients Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from patients who have experienced the Scanalyze difference
              in their healthcare journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-scanalyze-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The speed and accuracy of Scanalyze's diagnostic services are
                remarkable. I received my test results the next day with a
                detailed explanation."
              </p>
              <div className="font-medium">
                <p className="text-scanalyze-800">Sarah Johnson</p>
                <p className="text-gray-500 text-sm">Patient since 2021</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-scanalyze-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The online portal is so convenient. I can access all my test
                history, book appointments, and communicate with my healthcare
                provider."
              </p>
              <div className="font-medium">
                <p className="text-scanalyze-800">Michael Thompson</p>
                <p className="text-gray-500 text-sm">Patient since 2020</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center text-scanalyze-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "As a doctor, I regularly refer my patients to Scanalyze. Their
                diagnostic accuracy and comprehensive reporting help me provide
                better care."
              </p>
              <div className="font-medium">
                <p className="text-scanalyze-800">Dr. Emily Chen</p>
                <p className="text-gray-500 text-sm">Healthcare Partner</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-20 scanalyze-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-scanalyze-800 mb-6 max-w-3xl mx-auto">
            Ready to experience advanced diagnostic care?
          </h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust Scanalyze for their diagnostic
            needs. Get started today and take control of your health journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="scanalyze-button-primary px-8 py-6 text-lg h-auto"
              >
                Create Account
              </Button>
            </Link>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contact");
              }}
            >
              <Button
                size="lg"
                variant="outline"
                className="scanalyze-button-outline px-8 py-6 text-lg h-auto"
              >
                Contact Us
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        id="contact"
        ref={sectionRefs.contact}
        className={`bg-gray-50 py-12 border-t border-gray-200 transition-opacity duration-1000 ease-in-out ${
          isSectionVisible("contact") ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <Image
                src="/images/scanalyze-logo.png"
                alt="Scanalyze Logo"
                width={200}
                height={66}
                className="mb-4"
                quality={100}
                unoptimized
              />
              <p className="text-gray-500 mb-4 max-w-sm">
                Providing advanced diagnostic services with a commitment to
                accuracy, speed, and patient care.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-scanalyze-600">
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-scanalyze-600">
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-scanalyze-600">
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">Services</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("services");
                      }}
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Lab Testing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("services");
                      }}
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Medical Imaging
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("services");
                      }}
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Health Records
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("services");
                      }}
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Screenings
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Press
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection("contact");
                      }}
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      FAQs
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-scanalyze-600"
                    >
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-center">
              © {new Date().getFullYear()} Scanalyze Medical. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {!cookieConsentShown && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 px-4 py-4 sm:px-6 md:flex md:items-center md:justify-between">
          <div className="flex items-center mb-3 md:mb-0 md:w-3/4">
            <Info className="h-5 w-5 text-scanalyze-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking
              "Accept", you consent to our use of cookies.
            </p>
          </div>
          <div className="flex items-center justify-end space-x-3 md:w-1/4">
            <Link
              href="/privacy-policy"
              className="text-sm text-scanalyze-600 underline hover:text-scanalyze-800 transition-colors duration-300"
            >
              Privacy Policy
            </Link>
            <Button
              onClick={acceptCookies}
              className="scanalyze-button-primary text-sm py-1.5 px-3 h-auto"
            >
              Accept
            </Button>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 rounded-full bg-scanalyze-600 text-white p-3 shadow-lg transition-all duration-300 ${
          showBackToTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ChevronUp className="h-6 w-6" />
      </button>
    </main>
  );
}
