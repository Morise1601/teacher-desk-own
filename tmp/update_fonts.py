import os

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The user asked to avoid font-bold. Font-weight semibold is enough for buttons. 
    # Use only on limited required places. Avoid uppercase use capitalise.
    # The powershell command already changed uppercase to capitalize and font-black to font-semibold.
    # Now we need to change font-bold to font-medium globally, and font-semibold for buttons? 
    # Let's change all font-bold to font-medium or font-semibold depending if there's an obvious header, 
    # but the easiest is just replace 'font-bold' with 'font-medium' 
    # except for a few things, or maybe just replace 'font-bold' with 'font-medium' everywhere.
    # The user states: "Font-weight semibold is enough for buttons ... Avoid bold on all place use only on limited required places"
    
    # We will replace all font-bold with font-medium.
    # We will replace "font-medium" on buttons with "font-semibold". We will do this by looking for "button" or "Button" and "font-medium" or "font-bold".
    # Actually, simplistic string replacement:
    
    new_content = content.replace("font-bold", "font-medium")
    
    # Also fix some button cases that should have semibold
    # we can just use re to find <button className="..." ...
    import re
    # Replace any font-medium inside button className with font-semibold
    # simplistic: find <button ... </button>
    
    def repl_button(match):
        return match.group(0).replace("font-medium", "font-semibold").replace("font-bold", "font-semibold")

    new_content = re.sub(r'<button\b[^>]*>.*?</button>', repl_button, new_content, flags=re.DOTALL)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

for root, dirs, files in os.walk('app/dashboard/super-admin'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
