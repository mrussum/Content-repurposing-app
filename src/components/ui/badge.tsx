import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:  'border-[#c8ff0044] bg-[#c8ff0022] text-[#c8ff00]',
        secondary:'border-[#1e1e1e] bg-[#101010] text-[#555]',
        success:  'border-[#4ade8044] bg-[#4ade8022] text-[#4ade80]',
        error:    'border-[#ff707044] bg-[#ff707022] text-[#ff7070]',
        pro:      'border-[#c8ff0044] bg-[#c8ff0022] text-[#c8ff00]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
