import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Truck, Shield, Clock, Star, ArrowRight, CheckCircle2,
  Package, Users, MapPin, Calendar } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const userData = await base44.auth.me();
      setUser(userData);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(createPageUrl('CreateMove'));
    } else {
      base44.auth.redirectToLogin(createPageUrl('CreateMove'));
    }
  };

  const features = [
  {
    icon: Shield,
    title: 'Vetted Movers',
    description: 'Every moving company on our platform is thoroughly vetted and insured.'
  },
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description: 'Track your move from pickup to delivery with live status updates.'
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description: 'Customer ratings and reviews ensure consistent quality service.'
  },
  {
    icon: Package,
    title: 'Transparent Pricing',
    description: 'No hidden fees. Pay only for what you need, when you need it.'
  }];


  const steps = [
  {
    number: '01',
    title: 'List Your Items',
    description: 'Use our smart inventory wizard to catalog everything you need to move.'
  },
  {
    number: '02',
    title: 'Get Quotes',
    description: 'Receive competitive quotes from verified moving companies.'
  },
  {
    number: '03',
    title: 'Book & Pay',
    description: 'Choose your mover, pay a deposit, and secure your move date.'
  },
  {
    number: '04',
    title: 'Move Day',
    description: 'Track your move in real-time and pay the balance on arrival.'
  }];


  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-100/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>

              <div className="inline-flex items-center gap-2 bg-black/5 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Trusted by 10,000+ customers</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                Moving made
                <span className="block text-gray-400">simple & secure</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Book vetted moving companies, track your move in real-time, 
                and pay securely through our platform. No surprises, just smooth moves.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-gray-800 h-14 px-8 text-base"
                  onClick={handleGetStarted}>

                  Plan Your Move
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base"
                  asChild>

                  <Link to={createPageUrl('SupplierOnboarding')}>
                    Join as a Mover
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-gray-200">
                <div>
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-sm text-gray-500">Verified Movers</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold">4.8</p>
                  <p className="text-sm text-gray-500">Average Rating</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-sm text-gray-500">Moves Completed</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block">

              <div className="absolute -inset-4 bg-gradient-to-tr from-gray-100 to-white rounded-3xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/50 p-6 border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop"
                  alt="Moving truck"
                  className="rounded-xl w-full h-72 object-cover" />

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Move Confirmed</p>
                        <p className="text-sm text-gray-500">Cape Town → Johannesburg</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose House Moves?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We've built a platform that puts you in control of your move, 
              with transparency and quality at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) =>
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}>

                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From inventory to delivery, we've streamlined every step of the moving process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) =>
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative">

                {index < steps.length - 1 &&
              <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-200 -translate-x-1/2" />
              }
                <div className="text-5xl font-bold text-gray-100 mb-4">{step.number}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-black text-white hover:bg-gray-800"
              onClick={handleGetStarted}>

              Start Your Move
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to make your move?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">Join thousands of satisfied customers who trust House Movers for their residential and office relocations.


            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 h-14 px-8"
                onClick={handleGetStarted}>

                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 border-gray-700 text-white hover:bg-gray-900"
                asChild>

                <Link to={createPageUrl('SupplierOnboarding')} className="bg-slate-50 text-slate-950 px-8 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-14 border-gray-700 hover:bg-gray-900">Partner With Us

                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>);

}