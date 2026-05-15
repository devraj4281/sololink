import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const mappings = {
  // Map old basenames to their new relative paths from frontend/src
  'DefaultAvatar': 'components/ui/DefaultAvatar',
  'BorderAnimatedContainer': 'components/ui/BorderAnimatedContainer',
  'PageLoader': 'components/ui/PageLoader',
  
  'UsersLoadingSkeleton': 'components/feedback/UsersLoadingSkeleton',
  'MessagesLoadingSkeleton': 'components/feedback/MessagesLoadingSkeleton',
  'NoChatsFound': 'components/feedback/NoChatsFound',
  'NoChatHistoryPlaceholder': 'components/feedback/NoChatHistoryPlaceholder',
  'NoConversationPlaceholder': 'components/feedback/NoConversationPlaceholder',
  
  'ChatContainer': 'components/chat/ChatContainer',
  'ChatHeader': 'components/chat/ChatHeader',
  'MessageInput': 'components/chat/MessageInput',
  'ChatsList': 'components/chat/ChatsList',
  'DateSeparator': 'components/chat/DateSeparator',
  
  'ContactList': 'components/contacts/ContactList',
  'ProfileHeader': 'components/contacts/ProfileHeader',
  
  'ActiveTabSwitch': 'components/navigation/ActiveTabSwitch',
  
  'formatMessageDate': 'lib/formatMessageDate',
  
  'CallScreen': 'components/calls/CallScreen',
  'IncomingCallModal': 'components/calls/IncomingCallModal',
  'CallsList': 'components/calls/CallsList',
  'CallItem': 'components/calls/CallItem',
  'CallSystemMessage': 'components/calls/CallSystemMessage',
};

const componentsPattern = /\bimport\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      content = content.replace(componentsPattern, (match, importPath) => {
        // Only target internal relative imports
        if (!importPath.startsWith('.')) return match;
        
        const basename = path.basename(importPath, path.extname(importPath));
        if (mappings[basename]) {
          const targetAbs = path.join(srcDir, mappings[basename]);
          const currentDir = path.dirname(fullPath);
          let newRel = path.relative(currentDir, targetAbs);
          newRel = newRel.replace(/\\/g, '/');
          if (!newRel.startsWith('.')) {
            newRel = './' + newRel;
          }
          if (newRel !== importPath && newRel !== importPath + '.jsx' && newRel !== importPath + '.js') {
             changed = true;
             return match.replace(importPath, newRel);
          }
        }
        return match;
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
