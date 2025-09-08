#!/usr/bin/env python3

import cloudscraper
from bs4 import BeautifulSoup
import json
import re
import os
from typing import Dict, List, Optional


class ComprehensiveCodeforcesSolutionExtractor:
    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.problems_data = {}
        self.data_file = "comprehensive_codeforces_problems.json"
        self.load_existing_data()

    def load_existing_data(self):
        """Load existing problems data from JSON file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.problems_data = json.load(f)
                print(
                    f"Loaded {len(self.problems_data)} existing problems from {self.data_file}")
            except Exception as e:
                print(f"Error loading existing data: {e}")
                self.problems_data = {}

    def save_data(self):
        """Save problems data to JSON file."""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.problems_data, f, indent=2, ensure_ascii=False)
            print(
                f"Saved {len(self.problems_data)} problems to {self.data_file}")
        except Exception as e:
            print(f"Error saving data: {e}")

    def extract_problem_info(self, url: str) -> Optional[Dict]:
        """Extract basic problem information from a Codeforces problem page."""
        try:
            print(f"🔍 Fetching problem from: {url}")
            response = self.scraper.get(url)

            if response.status_code != 200:
                print(
                    f"❌ Failed to fetch URL. Status code: {response.status_code}")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract contest title
            contest_title_elem = soup.find(
                'th', string=lambda text: text and 'Codeforces Round' in text)
            if not contest_title_elem:
                contest_title_elem = soup.find(
                    'a', href=lambda href: href and '/contest/' in href)

            contest_title = ""
            if contest_title_elem:
                contest_title = contest_title_elem.get_text(strip=True)

            # Extract problem information
            problem_div = soup.find('div', class_='problem-statement')
            if not problem_div:
                print("❌ Could not find problem statement")
                return None

            # Extract problem title
            title_elem = problem_div.find('div', class_='title')
            problem_title = title_elem.get_text(
                strip=True) if title_elem else "Unknown"

            # Extract problem ID from URL
            url_parts = url.split('/')
            problem_id = ""
            if 'contest' in url_parts and 'problem' in url_parts:
                problem_index = url_parts.index('problem')
                if problem_index > 0:
                    problem_id = url_parts[problem_index-1] + url_parts[problem_index+1]
            elif 'problemset' in url_parts and 'problem' in url_parts:
                problem_index = url_parts.index('problem')
                if len(url_parts) > problem_index + 2:
                    problem_id = url_parts[problem_index+1] + url_parts[problem_index+2]

            # Extract constraints
            time_limit_elem = problem_div.find('div', class_='time-limit')
            memory_limit_elem = problem_div.find('div', class_='memory-limit')

            time_limit = ""
            memory_limit = ""

            if time_limit_elem:
                time_limit = time_limit_elem.get_text(
                    strip=True).replace('time limit per test', '').strip()
            if memory_limit_elem:
                memory_limit = memory_limit_elem.get_text(
                    strip=True).replace('memory limit per test', '').strip()

            # Extract problem statement
            statement_parts = []
            header = problem_div.find('div', class_='header')
            if header:
                current = header.find_next_sibling()
                while current and not (current.name == 'div' and 'sample-tests' in str(current.get('class', []))):
                    if current.name == 'div':
                        text = current.get_text(strip=True)
                        if text:
                            statement_parts.append(text)
                    current = current.find_next_sibling()

            problem_statement = '\n\n'.join(statement_parts)

            # Extract sample input/output
            sample_tests_div = problem_div.find('div', class_='sample-tests')
            sample_inputs = []
            sample_outputs = []

            if sample_tests_div:
                input_divs = sample_tests_div.find_all('div', class_='input')
                output_divs = sample_tests_div.find_all('div', class_='output')

                for input_div in input_divs:
                    pre_elem = input_div.find('pre')
                    if pre_elem:
                        sample_inputs.append(pre_elem.get_text(strip=True))

                for output_div in output_divs:
                    pre_elem = output_div.find('pre')
                    if pre_elem:
                        sample_outputs.append(pre_elem.get_text(strip=True))

            # Extract notes
            note_div = problem_div.find('div', class_='note')
            notes = note_div.get_text(strip=True) if note_div else ""

            # Extract tags
            tags = []
            tag_elements = soup.find_all('span', class_='tag-box')
            for tag_elem in tag_elements:
                tag_text = tag_elem.get_text(strip=True)
                if tag_text:
                    tags.append(tag_text)

            # Extract tutorial links
            tutorial_info = self.extract_tutorial_links(soup)

            problem_data = {
                'contest_title': contest_title,
                'problem_id': problem_id,
                'problem_title': problem_title,
                'time_limit': time_limit,
                'memory_limit': memory_limit,
                'statement': problem_statement,
                'sample_inputs': sample_inputs,
                'sample_outputs': sample_outputs,
                'notes': notes,
                'tags': tags,
                'url': url,
                'tutorial_info': tutorial_info,
                # Enhanced fields for editorial content
                'hints': [],
                'solutions': [],
                'tutorials': [],
                'editorials': []
            }

            return problem_data

        except Exception as e:
            print(f"❌ Error processing URL {url}: {e}")
            return None

    def extract_tutorial_links(self, soup) -> Dict:
        """Extract tutorial/editorial links from the contest materials section."""
        tutorial_info = {
            'has_tutorial': False,
            'tutorial_links': [],
            'announcement_links': []
        }

        # Search for tutorial links globally
        all_links = soup.find_all('a', href=True)

        for link in all_links:
            href = link.get('href')
            title = link.get('title', '')
            link_text = link.get_text(strip=True)

            # Check for tutorial/editorial keywords
            if any(keyword in link_text.lower() for keyword in ['tutorial', 'editorial']) or \
               any(keyword in title.lower() for keyword in ['tutorial', 'editorial']):

                tutorial_info['has_tutorial'] = True
                tutorial_info['tutorial_links'].append({
                    'text': link_text,
                    'title': title,
                    'url': href,
                    'full_url': f"https://codeforces.com{href}" if href.startswith('/') else href
                })
                print(f"✅ Found tutorial: {link_text} -> {href}")

        return tutorial_info

    def extract_all_editorial_content(self, editorial_url: str) -> List[Dict]:
        """Extract ALL problems and their content from an editorial page."""
        try:
            print(f"📖 Fetching editorial from: {editorial_url}")
            response = self.scraper.get(editorial_url)

            if response.status_code != 200:
                print(
                    f"❌ Failed to fetch editorial. Status code: {response.status_code}")
                return []



            # Extract all problems using the enhanced logic
            problems = self.extract_solutions_from_html(response.text)
            return problems

        except Exception as e:
            print(f"❌ Error processing editorial {editorial_url}: {e}")
            return []

    def extract_solutions_from_html(self, html_content: str) -> List[Dict]:
        """
        Enhanced extraction from editorial HTML - extracts ALL problems
        """
        problems = []
        soup = BeautifulSoup(html_content, 'html.parser')

        # Find the main content div that contains the editorial
        content_div = soup.find('div', class_='ttypography')
        if not content_div:
            print("Could not find main content div")
            return problems

        # Find all problem links - these are the starting points
        problem_links = content_div.find_all(
            'a', href=re.compile(r'/contest/\d+/problem/[A-Z]\d*'))
        print(f"Found {len(problem_links)} problem links in editorial")

        for link in problem_links:
            href = link.get('href')
            problem_text = link.get_text().strip()

            # Extract problem ID and name from the link text
            # Handle different formats: "2135C - Name" or "C — Name"
            problem_match = re.search(
                r'(\d+[A-Z]\d*|[A-Z]\d?)\s*[—-]\s*(.*)', problem_text)
            if not problem_match:
                continue

            problem_id = problem_match.group(1).strip()
            problem_name = problem_match.group(2).strip()

            # If it's just a letter, extract contest number from href and combine
            if re.match(r'^[A-Z]\d?$', problem_id):
                contest_match = re.search(r'/contest/(\d+)/problem/', href)
                if contest_match:
                    contest_num = contest_match.group(1)
                    problem_id = f"{contest_num}{problem_id}"

            print(f"Processing {problem_id} - {problem_name}")

            problem_data = {
                'id': problem_id,
                'name': f"{problem_id} - {problem_name}",
                'hints': [],
                'solutions': [],
                'tutorials': [],
                'editorials': []
            }

            # Find all spoilers that come after this problem link
            current_element = link.parent  # Start from the element containing the link

            # Look for spoilers in the next siblings
            for sibling in current_element.next_siblings:
                if sibling is None:
                    break

                # Skip NavigableString objects (text nodes)
                if not hasattr(sibling, 'name') or sibling.name is None:
                    continue

                # Stop if we hit another problem link
                if sibling.find('a', href=re.compile(r'/contest/\d+/problem/[A-Z]\d*')):
                    break

                # Check if this is a spoiler div
                if sibling.name == 'div' and 'spoiler' in sibling.get('class', []):
                    spoiler_title_elem = sibling.find(
                        'b', class_='spoiler-title')
                    if spoiler_title_elem:
                        spoiler_title = spoiler_title_elem.get_text().strip().lower()
                        spoiler_content_elem = sibling.find(
                            'div', class_='spoiler-content')

                        if spoiler_content_elem:
                            # Extract text content
                            text_content = spoiler_content_elem.get_text().strip()

                            # Extract code blocks
                            code_blocks = spoiler_content_elem.find_all(
                                ['pre', 'code'])
                            codes = []
                            seen_codes = set()  # To avoid duplicates
                            for code_block in code_blocks:
                                if code_block.name == 'pre' or (code_block.name == 'code' and code_block.parent.name == 'pre'):
                                    code_text = code_block.get_text()
                                    # Clean up HTML entities
                                    code_text = code_text.replace('&lt;', '<')
                                    code_text = code_text.replace('&gt;', '>')
                                    code_text = code_text.replace('&amp;', '&')
                                    code_text = code_text.replace('—', '-')
                                    clean_code = code_text.strip()
                                    if clean_code and clean_code not in seen_codes:
                                        codes.append(clean_code)
                                        seen_codes.add(clean_code)

                            content_data = {
                                'title': spoiler_title,
                                'text': text_content,
                                'codes': codes
                            }

                            # Categorize the spoiler based on its title
                            if 'hint' in spoiler_title:
                                problem_data['hints'].append(content_data)
                            elif 'solution' in spoiler_title or 'code' in spoiler_title:
                                problem_data['solutions'].append(content_data)
                            elif 'tutorial' in spoiler_title:
                                problem_data['tutorials'].append(content_data)
                            elif 'editorial' in spoiler_title:
                                problem_data['editorials'].append(content_data)
                            else:
                                # Default to solutions for ambiguous titles
                                problem_data['solutions'].append(content_data)

                            print(
                                f"  Found {spoiler_title}: {len(codes)} code blocks")

            # Only add problems that have some content
            total_content = len(problem_data['hints']) + len(problem_data['solutions']) + len(
                problem_data['tutorials']) + len(problem_data['editorials'])
            if total_content > 0:
                problems.append(problem_data)
                print(
                    f"✅ {problem_id}: {len(problem_data['hints'])} hints, {len(problem_data['solutions'])} solutions, {len(problem_data['tutorials'])} tutorials, {len(problem_data['editorials'])} editorials")
            else:
                print(f"⚠️  No content found for {problem_id}")

        return problems

    def process_problem_url(self, url: str) -> bool:
        """Process a single problem URL and extract both problem info and editorial solutions."""
        print(f"\n🚀 Starting complete processing for: {url}")

        # Extract basic problem info
        problem_data = self.extract_problem_info(url)
        if not problem_data:
            return False

        problem_id = problem_data['problem_id']
        print(f"✅ Successfully extracted problem: {problem_id}")

        # Process editorial if available
        tutorial_info = problem_data.get('tutorial_info', {})
        if tutorial_info.get('has_tutorial') and tutorial_info.get('tutorial_links'):
            for tutorial_link in tutorial_info['tutorial_links']:
                editorial_url = tutorial_link['full_url']
                print(f"📖 Processing editorial: {editorial_url}")

                # Extract ALL problems from editorial
                all_editorial_problems = self.extract_all_editorial_content(
                    editorial_url)
                print(
                    f"✅ Found {len(all_editorial_problems)} problems in editorial!")

                # Find the specific problem we're looking for
                target_problem = None
                for editorial_problem in all_editorial_problems:
                    if editorial_problem['id'] == problem_id:
                        target_problem = editorial_problem
                        break

                if target_problem:
                    # Merge editorial data into problem data
                    problem_data['hints'].extend(
                        target_problem.get('hints', []))
                    problem_data['solutions'].extend(
                        target_problem.get('solutions', []))
                    problem_data['tutorials'].extend(
                        target_problem.get('tutorials', []))
                    problem_data['editorials'].extend(
                        target_problem.get('editorials', []))

                    total_content = len(problem_data['hints']) + len(problem_data['solutions']) + len(
                        problem_data['tutorials']) + len(problem_data['editorials'])
                    print(
                        f"✅ Found {total_content} total content items for {problem_id}!")
                else:
                    print(f"⚠️  Could not find {problem_id} in editorial")

                # Also save all other problems found in editorial
                for editorial_problem in all_editorial_problems:
                    if editorial_problem['id'] != problem_id:
                        # Create a basic problem entry for this
                        basic_problem_data = {
                            'contest_title': problem_data['contest_title'],
                            'problem_id': editorial_problem['id'],
                            'problem_title': editorial_problem['name'],
                            'time_limit': '',
                            'memory_limit': '',
                            'statement': '',
                            'sample_inputs': [],
                            'sample_outputs': [],
                            'notes': '',
                            'tags': [],
                            'url': '',
                            'tutorial_info': tutorial_info,
                            'hints': editorial_problem.get('hints', []),
                            'solutions': editorial_problem.get('solutions', []),
                            'tutorials': editorial_problem.get('tutorials', []),
                            'editorials': editorial_problem.get('editorials', [])
                        }
                        self.problems_data[editorial_problem['id']
                                           ] = basic_problem_data
                        print(
                            f"✅ Also saved {editorial_problem['id']} from editorial")

                break  # Use first tutorial link
        else:
            print("⚠️  No tutorial/editorial found for this problem")

        # Save the main problem to problems data
        self.problems_data[problem_id] = problem_data
        self.save_data()

        print(f"✅ Problem {problem_id} processing complete!")
        return True

    def list_problems(self):
        """List all stored problems with numbers for selection."""
        if not self.problems_data:
            print("No problems found in database.")
            return {}

        print(f"\n📋 STORED PROBLEMS ({len(self.problems_data)}):")
        problem_list = {}
        for i, (problem_id, data) in enumerate(self.problems_data.items(), 1):
            hint_count = len(data.get('hints', []))
            solution_count = len(data.get('solutions', []))
            tutorial_count = len(data.get('tutorials', []))
            editorial_count = len(data.get('editorials', []))

            print(f"  {i}. {problem_id}: {data.get('problem_title', 'Unknown')} - {editorial_count} editorials, {hint_count} hints, {solution_count} solutions, {tutorial_count} tutorials")
            problem_list[str(i)] = problem_id

        return problem_list

    def display_problem(self, problem_data: Dict):
        """Display a problem's content in a nice format."""
        print(f"\n{'='*60}")
        print(
            f"Problem: {problem_data['problem_id']} - {problem_data['problem_title']}")
        print('='*60)

        print(f"\n📋 PROBLEM INFO:")
        print(f"Contest: {problem_data.get('contest_title', 'N/A')}")
        print(f"Time Limit: {problem_data.get('time_limit', 'N/A')}")
        print(f"Memory Limit: {problem_data.get('memory_limit', 'N/A')}")
        print(f"Tags: {', '.join(problem_data.get('tags', []))}")

        # Display editorials
        if problem_data.get('editorials'):
            print(f"\n📚 EDITORIALS ({len(problem_data['editorials'])}):")
            for i, editorial in enumerate(problem_data['editorials'], 1):
                print(f"\n{i}. {editorial['title'].title()}:")
                if editorial['text']:
                    print(
                        editorial['text'][:500] + "..." if len(editorial['text']) > 500 else editorial['text'])
                if editorial['codes']:
                    for j, code in enumerate(editorial['codes'], 1):
                        print(f"\nCode {j}:")
                        print("```cpp")
                        print(code)
                        print("```")

        # Display hints
        if problem_data.get('hints'):
            print(f"\n💡 HINTS ({len(problem_data['hints'])}):")
            for i, hint in enumerate(problem_data['hints'], 1):
                print(f"\n{i}. {hint['title'].title()}:")
                print(hint['text'])

        # Display tutorials
        if problem_data.get('tutorials'):
            print(f"\n📖 TUTORIALS ({len(problem_data['tutorials'])}):")
            for i, tutorial in enumerate(problem_data['tutorials'], 1):
                print(f"\n{i}. {tutorial['title'].title()}:")
                if tutorial['text']:
                    print(
                        tutorial['text'][:500] + "..." if len(tutorial['text']) > 500 else tutorial['text'])
                if tutorial['codes']:
                    for j, code in enumerate(tutorial['codes'], 1):
                        print(f"\nCode {j}:")
                        print("```cpp")
                        print(code)
                        print("```")

        # Display solutions
        if problem_data.get('solutions'):
            print(f"\n🔧 SOLUTIONS ({len(problem_data['solutions'])}):")
            for i, solution in enumerate(problem_data['solutions'], 1):
                print(f"\n{i}. {solution['title'].title()}:")
                if solution['text']:
                    print(
                        solution['text'][:300] + "..." if len(solution['text']) > 300 else solution['text'])
                if solution['codes']:
                    for j, code in enumerate(solution['codes'], 1):
                        print(f"\nCode {j}:")
                        print("```cpp")
                        print(code)
                        print("```")

    def search_problem(self, problem_id: str) -> Optional[Dict]:
        """Search for a problem by ID."""
        return self.problems_data.get(problem_id.upper())

    def interactive_mode(self):
        """Run in interactive mode."""
        print(f"\n{'='*60}")
        print("🎯 COMPREHENSIVE CODEFORCES SOLUTION EXTRACTOR")
        print('='*60)

        # Ask for URL first
        url = input("\n🔗 Enter Codeforces problem URL: ").strip()
        if url:
            success = self.process_problem_url(url)
            if not success:
                print("❌ Failed to process the problem.")
                return

        # Now run interactive mode
        print("\n" + "="*60)
        print("🎯 INTERACTIVE MODE")
        print('='*60)
        print("Commands:")
        print("  - Enter a number (1,2,3...) to select a problem")
        print("  - Enter a problem ID (e.g., 2135C) to search")
        print("  - Enter 'add <URL>' to process a new problem")
        print("  - Enter 'list' to show all problems")
        print("  - Enter 'quit' to exit")
        print("-" * 60)

        while True:
            try:
                # Show numbered list
                problem_list = self.list_problems()

                command = input("\n🔍 Enter command: ").strip()

                if command.lower() == 'quit':
                    print("👋 Goodbye!")
                    break
                elif command.lower() == 'list':
                    continue  # List is already shown above
                elif command.lower().startswith('add '):
                    url = command[4:].strip()
                    if url:
                        self.process_problem_url(url)
                    else:
                        print("❌ Please provide a URL after 'add'")
                elif command.isdigit() and command in problem_list:
                    # Select by number
                    problem_id = problem_list[command]
                    problem = self.search_problem(problem_id)
                    if problem:
                        self.display_problem(problem)
                elif command:
                    # Search for problem by ID
                    problem = self.search_problem(command)
                    if problem:
                        self.display_problem(problem)
                    else:
                        print(f"❌ Problem '{command}' not found.")

            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")


def main():
    extractor = ComprehensiveCodeforcesSolutionExtractor()
    extractor.interactive_mode()


if __name__ == "__main__":
    main()
