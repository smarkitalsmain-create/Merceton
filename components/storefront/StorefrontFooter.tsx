"use client"

import { StorefrontBranding } from "@/lib/storefront/core/config/schema"
import { Instagram, Facebook, Linkedin, Twitter, Youtube, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface StorefrontFooterProps {
  branding: StorefrontBranding
}

export function StorefrontFooter({ branding }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear()
  const copyrightText = branding.footerCopyright || `© ${currentYear} ${branding.storeDisplayName}. All rights reserved.`

  const socialLinks = [
    { key: "instagram", url: branding.social.instagram, icon: Instagram },
    { key: "facebook", url: branding.social.facebook, icon: Facebook },
    { key: "linkedin", url: branding.social.linkedin, icon: Linkedin },
    { key: "twitter", url: branding.social.twitter, icon: Twitter },
    { key: "youtube", url: branding.social.youtube, icon: Youtube },
    { key: "whatsapp", url: branding.social.whatsapp, icon: MessageCircle },
  ].filter((link) => link.url)

  return (
    <footer className="border-t mt-auto bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand Section */}
          <div className="space-y-4">
            {branding.logo && (
              <div className="relative h-12 w-32">
                <Image
                  src={branding.logo}
                  alt={branding.storeDisplayName}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <h3 className="text-lg font-semibold">{branding.storeDisplayName}</h3>
            {branding.tagline && (
              <p className="text-sm text-muted-foreground">{branding.tagline}</p>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Follow Us</h4>
              <div className="flex gap-4">
                {socialLinks.map(({ key, url, icon: Icon }) => (
                  <Link
                    key={key}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{copyrightText}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
