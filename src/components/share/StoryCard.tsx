import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Member {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface StoryCardProps {
  eventTitle: string;
  eventImageUrl: string | null;
  members: Member[];
  eventDate: string;
  shareUrl: string;
}

export const StoryCard = forwardRef<HTMLDivElement, StoryCardProps>(
  ({ eventTitle, eventImageUrl, members, eventDate, shareUrl }, ref) => {
    const friendCount = members.length - 1; // Exclude current user
    const displayMembers = members.slice(0, 5);

    return (
      <div
        ref={ref}
        className="relative w-[360px] h-[640px] overflow-hidden rounded-3xl"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {eventImageUrl ? (
            <img
              src={eventImageUrl}
              alt={eventTitle}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600" />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          {/* Top Section - Branding */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xl">🎉</span>
            </div>
            <div>
              <p className="font-bold text-lg">Gatherly</p>
              <p className="text-xs text-white/70">Meet new friends</p>
            </div>
          </div>

          {/* Middle Section - Event Info */}
          <div className="space-y-6">
            {/* Event Title */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <p className="text-sm text-white/70 mb-1">{eventDate}</p>
              <h2 className="text-xl font-bold line-clamp-2">{eventTitle}</h2>
            </div>

            {/* Main Message */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-black leading-tight">
                I met {friendCount} new {friendCount === 1 ? 'friend' : 'friends'}
                <br />
                tonight! 🥳
              </h1>

              {/* Avatars */}
              <div className="flex justify-center -space-x-3">
                {displayMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="relative"
                    style={{ zIndex: displayMembers.length - index }}
                  >
                    <Avatar className="h-14 w-14 border-4 border-white/20 shadow-lg">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-lg font-bold">
                        {member.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="h-14 w-14 rounded-full border-4 border-white/20 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-sm font-bold">+{members.length - 5}</span>
                  </div>
                )}
              </div>

              {/* Names */}
              <p className="text-sm text-white/80">
                {displayMembers
                  .slice(0, 3)
                  .map((m) => m.display_name || 'Friend')
                  .join(', ')}
                {members.length > 3 && ` & ${members.length - 3} more`}
              </p>
            </div>
          </div>

          {/* Bottom Section - CTA + QR */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">Join us next time!</p>
              <p className="font-semibold text-lg">gatherly.app</p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <QRCodeSVG
                value={shareUrl}
                size={64}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoryCard.displayName = 'StoryCard';
