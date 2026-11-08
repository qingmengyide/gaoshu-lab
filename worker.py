"""Isolate expensive symbolic work from the HTTP server."""
import json
import sys


def main():
    # Bound address space on Linux (available for Docker / self-hosting).
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 512 * 1024**2))
        resource.setrlimit(resource.RLIMIT_CPU, (10, 10))
    except (ImportError, ValueError, OSError):
        pass
    from engine import InputError, calculate
    try:
        result = calculate(json.load(sys.stdin))
    except InputError as error:
        result = {'error': str(error)}
    except Exception:
        result = {'error': '无法完成此计算。请检查表达式、定义域，或尝试简化问题。'}
    json.dump(result, sys.stdout, ensure_ascii=False, allow_nan=False)


if __name__ == '__main__':
    main()
