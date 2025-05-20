#!/bin/bash

# Setup script for TypeScript error prevention
echo "Setting up TypeScript error prevention tools..."

# Make sure the husky directory exists
mkdir -p .husky

# Make the pre-commit hook executable
chmod +x .husky/pre-commit

# Create a directory for the husky hooks if it doesn't exist
mkdir -p .husky/_

# Create the husky.sh script - essential for hooks to work
cat > .husky/_ << EOF
#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "\$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - \$1"
    fi
  }

  readonly hook_name="\$(basename "\$0")"
  debug "starting \$hook_name..."

  if [ "\$HUSKY" = "0" ]; then
    debug "HUSKY=0, skip running hooks"
    exit 0
  fi

  export readonly husky_skip_init=1
  sh -e "\$0" "\$@"
  exitCode="\$?"

  if [ \$exitCode != 0 ]; then
    echo "husky - \$hook_name hook exited with code \$exitCode (error)"
  fi

  exit \$exitCode
fi
EOF

# Make the husky.sh script executable
chmod +x .husky/_/husky.sh

echo "✅ Type checking setup complete!"
echo ""
echo "Usage:"
echo "  • To manually run type checking: node scripts/type-check.js"
echo "  • For strict checking: node scripts/type-check.js --strict"
echo "  • Watch mode: node scripts/type-check.js --watch"
echo ""
echo "The pre-commit hook will automatically run these checks when you commit code."